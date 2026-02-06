"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { DayStatistic } from "@/hooks/use-statistics";

interface ActivityHeatmapProps {
  data: DayStatistic[];
  year: number;
}

// Generate all dates for a year grouped by week
function generateYearGrid(year: number) {
  const grid: (Date | null)[][] = [];
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);

  // Start from the first Sunday before or on Jan 1
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const currentDate = new Date(startDate);
  let currentWeek: (Date | null)[] = [];

  while (currentDate <= lastDay || currentWeek.length > 0) {
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }

    if (currentDate <= lastDay) {
      // Only include dates that are in the target year
      if (currentDate.getFullYear() === year) {
        currentWeek.push(new Date(currentDate));
      } else {
        currentWeek.push(null);
      }
    } else if (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }

    currentDate.setDate(currentDate.getDate() + 1);

    // Break if we've passed the year and filled the last week
    if (currentDate.getFullYear() > year && currentWeek.length === 0) {
      break;
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    grid.push(currentWeek);
  }

  return grid;
}

function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const intensityColors = [
  "bg-muted", // 0 shifts
  "bg-primary/20", // 1 shift
  "bg-primary/40", // 2 shifts
  "bg-primary/70", // 3-4 shifts
  "bg-primary", // 5+ shifts
];

export function ActivityHeatmap({ data, year }: ActivityHeatmapProps) {
  const t = useTranslations("statistics");
  const tCommon = useTranslations("common");

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of data) {
      map.set(item.date, item.count);
    }
    return map;
  }, [data]);

  const grid = useMemo(() => generateYearGrid(year), [year]);

  const months = useMemo(() => {
    const monthLabels: { label: string; startWeek: number }[] = [];
    let currentMonth = -1;

    grid.forEach((week, weekIndex) => {
      for (const date of week) {
        if (date && date.getMonth() !== currentMonth) {
          currentMonth = date.getMonth();
          monthLabels.push({
            label: date.toLocaleDateString("default", { month: "short" }),
            startWeek: weekIndex,
          });
          break;
        }
      }
    });

    return monthLabels;
  }, [grid]);

  const dayLabels = [
    tCommon("weekDays.sun"),
    tCommon("weekDays.mon"),
    tCommon("weekDays.tue"),
    tCommon("weekDays.wed"),
    tCommon("weekDays.thu"),
    tCommon("weekDays.fri"),
    tCommon("weekDays.sat"),
  ];

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="text-muted-foreground ml-8 flex text-xs">
        {months.map((month, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{
              marginLeft:
                i === 0 ? 0 : `${(month.startWeek - (months[i - 1]?.startWeek || 0) - 1) * 14}px`,
              width: "fit-content",
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="text-muted-foreground flex flex-col gap-[3px] pr-2 text-xs">
          {dayLabels.map((day, i) => (
            <div
              key={day}
              className={cn("h-[11px] leading-[11px]", i % 2 === 0 ? "invisible" : "")}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto pb-2">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={dayIndex} className="h-[11px] w-[11px]" />;
                }

                const dateStr = date.toISOString().split("T")[0];
                const count = dataMap.get(dateStr) || 0;
                const level = getIntensityLevel(count);

                return (
                  <div
                    key={dayIndex}
                    className={cn("h-[11px] w-[11px] rounded-sm", intensityColors[level])}
                    title={`${dateStr}: ${count} ${count === 1 ? t("shift") : t("shifts")}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
        <span>{t("less")}</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={cn("h-[11px] w-[11px] rounded-sm", color)} />
        ))}
        <span>{t("more")}</span>
      </div>
    </div>
  );
}
