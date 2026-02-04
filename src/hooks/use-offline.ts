"use client";

import { useEffect, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { CachedEvent, CachedEventPosition } from "@/lib/offline";
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

// Lazy load offline database functions to avoid SSR issues with IndexedDB
async function getOfflineDb() {
  const { offlineDb } = await import("@/lib/offline");
  return offlineDb;
}

async function getClearOldCache() {
  const { clearOldCache } = await import("@/lib/offline");
  return clearOldCache;
}

export function useOfflineEvents() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [cachedEvents, setCachedEvents] = useState<CachedEvent[]>([]);

  // Load cached events from IndexedDB on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    const loadCached = async () => {
      try {
        const db = await getOfflineDb();
        const now = new Date().toISOString();
        const events = await db.events.where("end_date").aboveOrEqual(now).sortBy("start_date");
        if (isMounted) {
          setCachedEvents(events);
        }
      } catch (error) {
        console.error("Failed to load cached events:", error);
      }
    };
    loadCached();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get cached positions for a specific event
  const getCachedPositions = useCallback(async (eventId: string) => {
    const db = await getOfflineDb();
    return db.positions.where("event_id").equals(eventId).toArray();
  }, []);

  // Sync events from server when online
  const { data: serverEvents, isLoading } = useQuery({
    queryKey: ["offline-events-sync", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const now = new Date().toISOString();

      // Get events where user is registered
      const registrations = await getPb()
        .collection("event_registrations")
        .getFullList<EventRegistrationRecord>({
          filter: `user = "${user.id}"`,
        });

      const registeredEventIds = new Set(registrations.map((r) => r.event));

      // Get active/upcoming events
      const events = await getPb()
        .collection("events")
        .getFullList<EventWithExpand>({
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
      const clearCache = await getClearOldCache();
      await clearCache();

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
  const db = await getOfflineDb();
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

  await db.events.bulkPut(cachedEvents);
}

async function cacheEventPositions(eventId: string, userId: string) {
  try {
    const db = await getOfflineDb();
    const positions = await getPb()
      .collection("event_positions")
      .getFullList<PositionWithExpand>({
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

    await db.positions.bulkPut(cachedPositions);
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
            return getPb().collection(collection).create(data);
          case "update":
            if (!recordId) throw new Error("Record ID required for update");
            return getPb().collection(collection).update(recordId, data);
          case "delete":
            if (!recordId) throw new Error("Record ID required for delete");
            return getPb().collection(collection).delete(recordId);
        }
      } else {
        // Queue for later when offline
        const db = await getOfflineDb();
        await db.mutations.add({
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
    const db = await getOfflineDb();
    const pending = await db.mutations.toArray();

    for (const mutation of pending) {
      try {
        switch (mutation.type) {
          case "create":
            await getPb().collection(mutation.collection).create(mutation.data);
            break;
          case "update":
            if (mutation.record_id) {
              await getPb()
                .collection(mutation.collection)
                .update(mutation.record_id, mutation.data);
            }
            break;
          case "delete":
            if (mutation.record_id) {
              await getPb().collection(mutation.collection).delete(mutation.record_id);
            }
            break;
        }
        // Remove from queue after successful sync
        if (mutation.id) {
          await db.mutations.delete(mutation.id);
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
