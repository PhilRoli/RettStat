"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EventList } from "@/components/events";
import { useEvents } from "@/hooks/use-events";
import { useHasPermission } from "@/hooks/use-permissions";
import Link from "next/link";

export default function EventsPage() {
  const t = useTranslations("events");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: events, isLoading, error } = useEvents({ status: "published" });
  const { hasPermission: canCreateEvent } = useHasPermission("create_events");

  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!events) return { upcomingEvents: [], pastEvents: [] };

    const today = new Date().toISOString().split("T")[0];

    return {
      upcomingEvents: events.filter((e) => e.end_date >= today),
      pastEvents: events.filter((e) => e.end_date < today).reverse(),
    };
  }, [events]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-4">
          {t("errorLoading")}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {canCreateEvent && (
          <Button asChild>
            <Link href="/admin?tab=events">
              <Plus className="mr-2 h-4 w-4" />
              {t("createEvent")}
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "upcoming" | "past")}>
        <TabsList>
          <TabsTrigger value="upcoming">
            {t("upcoming")} {!isLoading && `(${upcomingEvents.length})`}
          </TabsTrigger>
          <TabsTrigger value="past">
            {t("past")} {!isLoading && `(${pastEvents.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <EventList events={upcomingEvents} emptyMessage={t("noUpcomingEvents")} />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <EventList events={pastEvents} emptyMessage={t("noPastEvents")} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
