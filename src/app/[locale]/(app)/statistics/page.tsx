"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStatistics } from "@/hooks/use-statistics";
import {
  ActivityHeatmap,
  VehicleCategoryChart,
  StatsSummary,
  YearSelector,
} from "@/components/statistics";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsPage() {
  const t = useTranslations("statistics");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { data, isLoading, error } = useStatistics(year);

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
        <YearSelector year={year} onChange={setYear} />
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        data && <StatsSummary data={data.summary} year={year} />
      )}

      {/* Activity Heatmap */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">{t("activityOverview")}</h2>
        {isLoading ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          data && <ActivityHeatmap data={data.dailyStats} year={year} />
        )}
      </div>

      {/* Vehicle Category Chart */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">{t("shiftsByVehicleType")}</h2>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          data && <VehicleCategoryChart data={data.vehicleTypeStats} />
        )}
      </div>
    </div>
  );
}
