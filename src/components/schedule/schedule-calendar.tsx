"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MyTourWithExpand } from "@/hooks/use-my-schedule";

interface ScheduleCalendarProps {
  tours: MyTourWithExpand[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick?: (date: Date) => void;
}

export function ScheduleCalendar({
  tours,
  currentDate,
  onDateChange,
  onDayClick,
}: ScheduleCalendarProps) {
  const t = useTranslations("schedule");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-AT" : "en-US";

  // Group tours by date
  const toursByDate = useMemo(() => {
    const map = new Map<string, MyTourWithExpand[]>();
    for (const tour of tours) {
      const date = tour.expand?.shiftplan?.date;
      if (date) {
        const existing = map.get(date) || [];
        map.set(date, [...existing, tour]);
      }
    }
    return map;
  }, [tours]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentDate]);

  const prevMonth = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = [
    tCommon("weekDays.sun"),
    tCommon("weekDays.mon"),
    tCommon("weekDays.tue"),
    tCommon("weekDays.wed"),
    tCommon("weekDays.thu"),
    tCommon("weekDays.fri"),
    tCommon("weekDays.sat"),
  ];

  return (
    <div className="bg-card rounded-lg border p-4">
      {/* Header with month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
        </h3>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-1 text-center text-sm">
        {weekDays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = date.toISOString().split("T")[0];
          const dayTours = toursByDate.get(dateStr) || [];
          const hasShifts = dayTours.length > 0;
          const isToday = date.getTime() === today.getTime();
          const isPast = date < today;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick?.(date)}
              className={cn(
                "aspect-square rounded-md p-1 text-sm transition-colors",
                "hover:bg-accent flex flex-col items-center justify-center",
                isToday && "ring-primary ring-2",
                isPast && "text-muted-foreground",
                hasShifts && "bg-primary/10 font-medium"
              )}
            >
              <span>{date.getDate()}</span>
              {hasShifts && (
                <div className="mt-0.5 flex gap-0.5">
                  {dayTours.slice(0, 3).map((_, i) => (
                    <div key={i} className="bg-primary h-1 w-1 rounded-full" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="bg-primary/10 h-3 w-3 rounded" />
          <span>{t("hasShifts")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="ring-primary h-3 w-3 rounded ring-2" />
          <span>{t("today")}</span>
        </div>
      </div>
    </div>
  );
}
