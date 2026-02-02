"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  offlineDb,
  clearOldCache,
  type CachedEvent,
  type CachedEventPosition,
} from "@/lib/offline";
import type {
  EventRecord,
  EventPositionRecord,
  EventRegistrationRecord,
} from "@/lib/pocketbase/types";

interface EventWithExpand extends EventRecord {
  expand?: {
    category?: { name: string; color?: string };
  };
}

interface PositionWithExpand extends EventPositionRecord {
  expand?: {
    registrations_via_position?: EventRegistrationRecord[];
  };
}

export function useOfflineEvents() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  // Get cached events from IndexedDB
  const cachedEvents = useLiveQuery(async () => {
    const now = new Date().toISOString();
    return offlineDb.events.where("end_date").aboveOrEqual(now).sortBy("start_date");
  }, []);

  // Get cached positions for a specific event
  const getCachedPositions = useCallback(async (eventId: string) => {
    return offlineDb.positions.where("event_id").equals(eventId).toArray();
  }, []);

  // Sync events from server when online
  const { data: serverEvents, isLoading } = useQuery({
    queryKey: ["offline-events-sync", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const now = new Date().toISOString();

      // Get events where user is registered
      const registrations = await pb
        .collection("event_registrations")
        .getFullList<EventRegistrationRecord>({
          filter: `user = "${user.id}"`,
        });

      const registeredEventIds = new Set(registrations.map((r) => r.event));

      // Get active/upcoming events
      const events = await pb.collection("events").getFullList<EventWithExpand>({
        filter: `end_date >= "${now}"`,
        expand: "category",
        sort: "start_date",
      });

      // Filter to events user is part of
      const userEvents = events.filter((e) => registeredEventIds.has(e.id));

      // Cache to IndexedDB
      await cacheEvents(userEvents);

      // Also cache positions for these events
      for (const event of userEvents) {
        await cacheEventPositions(event.id, user.id);
      }

      // Clear old cache
      await clearOldCache();

      return userEvents;
    },
    enabled: isOnline && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Return cached data when offline, server data when online
  const events = isOnline ? serverEvents : cachedEvents;

  return {
    events: events || [],
    isLoading: isOnline ? isLoading : false,
    isOffline: !isOnline,
    getCachedPositions,
    syncNow: () => queryClient.invalidateQueries({ queryKey: ["offline-events-sync"] }),
  };
}

async function cacheEvents(events: EventWithExpand[]) {
  const cachedEvents: CachedEvent[] = events.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    location: e.location,
    start_date: e.start_date,
    end_date: e.end_date,
    category_id: e.category,
    category_name: e.expand?.category?.name,
    category_color: e.expand?.category?.color,
    synced_at: new Date().toISOString(),
  }));

  await offlineDb.events.bulkPut(cachedEvents);
}

async function cacheEventPositions(eventId: string, userId: string) {
  try {
    const positions = await pb.collection("event_positions").getFullList<PositionWithExpand>({
      filter: `event = "${eventId}"`,
      expand: "registrations_via_position",
    });

    const cachedPositions: CachedEventPosition[] = positions.map((p) => {
      const registrations = p.expand?.registrations_via_position || [];
      return {
        id: p.id,
        event_id: eventId,
        name: p.name,
        description: p.description,
        required_qualifications: p.required_qualifications,
        min_count: p.min_count,
        max_count: p.max_count,
        current_participants: registrations.length,
        user_registered: registrations.some((r) => r.user === userId),
      };
    });

    await offlineDb.positions.bulkPut(cachedPositions);
  } catch (error) {
    console.error("Failed to cache positions for event:", eventId, error);
  }
}

// Hook to queue mutations when offline
export function useOfflineMutation() {
  const isOnline = useOnlineStatus();

  const queueMutation = useCallback(
    async (
      type: "create" | "update" | "delete",
      collection: string,
      data: Record<string, unknown>,
      recordId?: string
    ) => {
      if (isOnline) {
        // Execute directly when online
        switch (type) {
          case "create":
            return pb.collection(collection).create(data);
          case "update":
            if (!recordId) throw new Error("Record ID required for update");
            return pb.collection(collection).update(recordId, data);
          case "delete":
            if (!recordId) throw new Error("Record ID required for delete");
            return pb.collection(collection).delete(recordId);
        }
      } else {
        // Queue for later when offline
        await offlineDb.mutations.add({
          type,
          collection,
          record_id: recordId,
          data,
          created_at: new Date().toISOString(),
        });
        return { queued: true };
      }
    },
    [isOnline]
  );

  return { queueMutation, isOnline };
}

// Hook to sync pending mutations when back online
export function useSyncPendingMutations() {
  const isOnline = useOnlineStatus();

  const syncPending = useCallback(async () => {
    const pending = await offlineDb.mutations.toArray();

    for (const mutation of pending) {
      try {
        switch (mutation.type) {
          case "create":
            await pb.collection(mutation.collection).create(mutation.data);
            break;
          case "update":
            if (mutation.record_id) {
              await pb.collection(mutation.collection).update(mutation.record_id, mutation.data);
            }
            break;
          case "delete":
            if (mutation.record_id) {
              await pb.collection(mutation.collection).delete(mutation.record_id);
            }
            break;
        }
        // Remove from queue after successful sync
        if (mutation.id) {
          await offlineDb.mutations.delete(mutation.id);
        }
      } catch (error) {
        console.error("Failed to sync mutation:", mutation, error);
      }
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPending();
    }
  }, [isOnline, syncPending]);

  return { syncPending };
}
