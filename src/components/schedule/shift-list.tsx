"use client";

import { useTranslations } from "next-intl";
import { Clock, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MyTourWithExpand } from "@/hooks/use-my-schedule";

interface ShiftListProps {
  tours: MyTourWithExpand[];
  title?: string;
  emptyMessage?: string;
  compact?: boolean;
}

export function ShiftList({ tours, title, emptyMessage, compact = false }: ShiftListProps) {
  const t = useTranslations("schedule");

  if (tours.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center rounded-lg border border-dashed text-sm">
        {emptyMessage || t("noShifts")}
      </div>
    );
  }

  // Group tours by date
  const toursByDate = tours.reduce(
    (acc, tour) => {
      const date = tour.expand?.shiftplan?.date || "unknown";
      if (!acc[date]) acc[date] = [];
      acc[date].push(tour);
      return acc;
    },
    {} as Record<string, MyTourWithExpand[]>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return t("today");
    if (date.getTime() === tomorrow.getTime()) return t("tomorrow");

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => time.substring(0, 5);

  return (
    <div className="space-y-4">
      {title && <h3 className="font-semibold">{title}</h3>}

      {Object.entries(toursByDate).map(([date, dateTours]) => (
        <div key={date}>
          <div className="text-muted-foreground mb-2 text-sm font-medium">{formatDate(date)}</div>
          <div className={cn("space-y-2", compact && "space-y-1")}>
            {dateTours.map((tour) => (
              <div key={tour.id} className={cn("bg-card rounded-lg border p-3", compact && "p-2")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tour.expand?.vehicle && (
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Car className="text-muted-foreground h-4 w-4" />
                        <span>{tour.expand.vehicle.call_sign}</span>
                        {tour.expand.vehicle.expand?.vehicle_type && (
                          <span className="text-muted-foreground">
                            ({tour.expand.vehicle.expand.vehicle_type.name})
                          </span>
                        )}
                      </div>
                    )}
                    {!tour.expand?.vehicle && tour.name && (
                      <span className="text-sm font-medium">{tour.name}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(tour.start_time)} - {formatTime(tour.end_time)}
                    </span>
                  </div>
                </div>
                {tour.notes && !compact && (
                  <p className="text-muted-foreground mt-2 text-sm">{tour.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
