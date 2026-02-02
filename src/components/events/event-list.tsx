"use client";

import { useTranslations } from "next-intl";
import { EventCard } from "./event-card";
import type { EventWithExpand } from "@/hooks/use-events";

interface EventListProps {
  events: EventWithExpand[];
  emptyMessage?: string;
}

export function EventList({ events, emptyMessage }: EventListProps) {
  const t = useTranslations("events");

  if (events.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed">
        {emptyMessage || t("noEvents")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
