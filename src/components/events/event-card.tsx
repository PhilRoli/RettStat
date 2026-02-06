"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EventWithExpand } from "@/hooks/use-events";

interface EventCardProps {
  event: EventWithExpand;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
};

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations("events");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-AT" : "en-US";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isMultiDay = event.start_date !== event.end_date;

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              {event.expand?.category && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: event.expand.category.color,
                    color: event.expand.category.color,
                  }}
                >
                  {event.expand.category.name}
                </Badge>
              )}
              <Badge className={cn("text-xs", statusColors[event.status])}>
                {t(`status.${event.status}`)}
              </Badge>
            </div>

            <h3 className="truncate font-semibold">{event.name}</h3>

            {event.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{event.description}</p>
            )}

            <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(event.start_date)}
                  {isMultiDay && ` - ${formatDate(event.end_date)}`}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {event.max_participants && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {t("maxParticipants")}: {event.max_participants}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
