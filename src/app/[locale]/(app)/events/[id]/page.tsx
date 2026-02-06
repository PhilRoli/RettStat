"use client";

import { use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PositionList } from "@/components/events";
import { useEvent, useEventPositions } from "@/hooks/use-events";
import { useHasPermission } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("events");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-AT" : "en-US";
  const router = useRouter();

  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: positions, isLoading: positionsLoading } = useEventPositions(id);
  const { hasPermission: canEdit } = useHasPermission("manage_events");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    return timeStr.substring(0, 5); // HH:MM
  };

  if (eventLoading) {
    return (
      <div className="container mx-auto space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-4">
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-4">
          {t("eventNotFound")}
        </div>
      </div>
    );
  }

  const isMultiDay = event.start_date !== event.end_date;

  return (
    <div className="container mx-auto space-y-6 p-4 pb-20 md:pb-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("backToEvents")}
      </Button>

      {/* Event header */}
      <div className="bg-card rounded-lg border p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
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

        <h1 className="mb-4 text-2xl font-bold">{event.name}</h1>

        {event.description && <p className="text-muted-foreground mb-6">{event.description}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <div>
              <div className="text-sm font-medium">{t("date")}</div>
              <div className="text-muted-foreground text-sm">
                {formatDate(event.start_date)}
                {isMultiDay && ` - ${formatDate(event.end_date)}`}
              </div>
            </div>
          </div>

          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-3">
              <Clock className="text-muted-foreground h-5 w-5" />
              <div>
                <div className="text-sm font-medium">{t("time")}</div>
                <div className="text-muted-foreground text-sm">
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </div>
              </div>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className="text-muted-foreground h-5 w-5" />
              <div>
                <div className="text-sm font-medium">{t("location")}</div>
                <div className="text-muted-foreground text-sm">{event.location}</div>
              </div>
            </div>
          )}

          {event.expand?.unit && (
            <div className="flex items-center gap-3">
              <Building2 className="text-muted-foreground h-5 w-5" />
              <div>
                <div className="text-sm font-medium">{t("unit")}</div>
                <div className="text-muted-foreground text-sm">{event.expand.unit.name}</div>
              </div>
            </div>
          )}

          {event.max_participants && (
            <div className="flex items-center gap-3">
              <Users className="text-muted-foreground h-5 w-5" />
              <div>
                <div className="text-sm font-medium">{t("maxParticipants")}</div>
                <div className="text-muted-foreground text-sm">{event.max_participants}</div>
              </div>
            </div>
          )}
        </div>

        {event.notes && (
          <div className="bg-muted/50 mt-6 rounded-md p-4">
            <div className="text-sm font-medium">{t("notes")}</div>
            <div className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
              {event.notes}
            </div>
          </div>
        )}
      </div>

      {/* Positions */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("positions")}</h2>
        {positionsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <PositionList
            positions={positions || []}
            eventId={event.id}
            unitId={event.unit}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
}
