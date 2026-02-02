"use client";

import { useTranslations } from "next-intl";
import { Calendar, TrendingUp, CalendarDays } from "lucide-react";
import type { StatisticsSummary } from "@/hooks/use-statistics";

interface StatsSummaryProps {
  data: StatisticsSummary;
  year: number;
}

export function StatsSummary({ data, year }: StatsSummaryProps) {
  const t = useTranslations("statistics");
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;

  const cards = [
    {
      label: t("totalShifts", { year }),
      value: data.totalShifts,
      icon: Calendar,
    },
    {
      label: t("thisMonth"),
      value: isCurrentYear ? data.thisMonth : "-",
      icon: CalendarDays,
      hidden: !isCurrentYear,
    },
    {
      label: t("averagePerMonth"),
      value: data.averagePerMonth,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards
        .filter((card) => !card.hidden)
        .map((card) => (
          <div key={card.label} className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2">
              <card.icon className="h-4 w-4" />
              <span className="text-sm">{card.label}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{card.value}</div>
          </div>
        ))}
    </div>
  );
}
