"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pb } from "@/lib/pocketbase";
import type {
  EventRecord,
  EventCategoryRecord,
  EventPositionRecord,
  EventRegistrationRecord,
  ProfileRecord,
} from "@/lib/pocketbase/types";

// Extended types with relations
export interface EventWithExpand extends EventRecord {
  expand?: {
    category?: EventCategoryRecord;
    unit?: { id: string; name: string };
    created_by?: { id: string; email: string };
  };
}

export interface EventPositionWithExpand extends EventPositionRecord {
  expand?: {
    required_qualifications?: { id: string; name: string }[];
  };
  registrations?: EventRegistrationWithExpand[];
}

export interface EventRegistrationWithExpand extends EventRegistrationRecord {
  expand?: {
    user?: ProfileRecord;
    position?: EventPositionRecord;
    confirmed_by?: { id: string; email: string };
  };
}

// Fetch all events with optional filters
export function useEvents(options?: { status?: string; upcoming?: boolean; unitId?: string }) {
  return useQuery({
    queryKey: ["events", options],
    queryFn: async () => {
      let filter = "";
      const filters: string[] = [];

      if (options?.status) {
        filters.push(`status = "${options.status}"`);
      }

      if (options?.upcoming) {
        const today = new Date().toISOString().split("T")[0];
        filters.push(`end_date >= "${today}"`);
      }

      if (options?.unitId) {
        filters.push(`unit = "${options.unitId}"`);
      }

      if (filters.length > 0) {
        filter = filters.join(" && ");
      }

      const events = await pb.collection("events").getFullList<EventWithExpand>({
        filter,
        expand: "category,unit",
        sort: "start_date",
      });

      return events;
    },
  });
}

// Fetch single event with full details
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const event = await pb.collection("events").getOne<EventWithExpand>(eventId, {
        expand: "category,unit,created_by",
      });

      return event;
    },
    enabled: !!eventId,
  });
}

// Fetch positions for an event with registrations
export function useEventPositions(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-positions", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      // Fetch positions
      const positions = await pb
        .collection("event_positions")
        .getFullList<EventPositionWithExpand>({
          filter: `event = "${eventId}"`,
          expand: "required_qualifications",
          sort: "sort_order",
        });

      // Fetch registrations for these positions
      const registrations = await pb
        .collection("event_registrations")
        .getFullList<EventRegistrationWithExpand>({
          filter: `event = "${eventId}"`,
          expand: "user,position",
        });

      // Attach registrations to positions
      return positions.map((pos) => ({
        ...pos,
        registrations: registrations.filter((reg) => reg.position === pos.id),
      }));
    },
    enabled: !!eventId,
  });
}

// Fetch event categories
export function useEventCategories() {
  return useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      return pb.collection("event_categories").getFullList<EventCategoryRecord>({
        sort: "name",
      });
    },
  });
}

// Event mutations
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EventRecord>) => {
      return pb.collection("events").create<EventRecord>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventRecord> }) => {
      return pb.collection("events").update<EventRecord>(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", variables.id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return pb.collection("events").delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// Position mutations
export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EventPositionRecord>) => {
      return pb.collection("event_positions").create<EventPositionRecord>(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-positions", variables.event] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventPositionRecord> }) => {
      return pb.collection("event_positions").update<EventPositionRecord>(id, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["event-positions", result.event] });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await pb.collection("event_positions").delete(id);
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event-positions", eventId] });
    },
  });
}

// Registration mutations
export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EventRegistrationRecord>) => {
      return pb.collection("event_registrations").create<EventRegistrationRecord>({
        ...data,
        registered_at: new Date().toISOString(),
        status: "confirmed", // Admin assigns directly as confirmed
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-positions", variables.event] });
    },
  });
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await pb.collection("event_registrations").delete(id);
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event-positions", eventId] });
    },
  });
}
