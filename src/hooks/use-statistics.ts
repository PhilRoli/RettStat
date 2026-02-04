"use client";

import { useQuery } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/use-auth";
import type { TourRecord, VehicleRecord, VehicleTypeRecord } from "@/lib/pocketbase/types";

interface TourWithExpand extends TourRecord {
  expand?: {
    vehicle?: VehicleRecord & {
      expand?: {
        vehicle_type?: VehicleTypeRecord;
      };
    };
    shiftplan?: {
      date: string;
    };
  };
}

export interface DayStatistic {
  date: string;
  count: number;
}

export interface VehicleTypeStat {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface StatisticsSummary {
  totalShifts: number;
  thisMonth: number;
  averagePerMonth: number;
}

export interface StatisticsData {
  dailyStats: DayStatistic[];
  vehicleTypeStats: VehicleTypeStat[];
  summary: StatisticsSummary;
}

export function useStatistics(year: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["statistics", profile?.id, year],
    queryFn: async (): Promise<StatisticsData> => {
      if (!profile?.id) {
        return {
          dailyStats: [],
          vehicleTypeStats: [],
          summary: { totalShifts: 0, thisMonth: 0, averagePerMonth: 0 },
        };
      }

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Fetch vehicle types for colors and names
      const vehicleTypes = await getPb()
        .collection("vehicle_types")
        .getFullList<VehicleTypeRecord>();

      // Fetch tours where user is driver, lead, or student
      const tours = await getPb()
        .collection("tours")
        .getFullList<TourWithExpand>({
          filter: `(driver = "${profile.id}" || lead = "${profile.id}" || student = "${profile.id}") && shiftplan.date >= "${startDate}" && shiftplan.date <= "${endDate}"`,
          expand: "vehicle.vehicle_type,shiftplan",
          sort: "shiftplan.date",
        });

      // Group by date for heatmap
      const dateMap = new Map<string, number>();
      const vehicleTypeMap = new Map<string, number>();

      for (const tour of tours) {
        const date = tour.expand?.shiftplan?.date;
        if (date) {
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        }

        const vehicleTypeId = tour.expand?.vehicle?.expand?.vehicle_type?.id;
        if (vehicleTypeId) {
          vehicleTypeMap.set(vehicleTypeId, (vehicleTypeMap.get(vehicleTypeId) || 0) + 1);
        }
      }

      const dailyStats: DayStatistic[] = Array.from(dateMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      // Map vehicle type stats with colors from database
      const vehicleTypeStats: VehicleTypeStat[] = vehicleTypes
        .map((vt) => ({
          id: vt.id,
          name: vt.name,
          color: "#6366f1", // Default color - vehicle_types might not have color field
          count: vehicleTypeMap.get(vt.id) || 0,
        }))
        .filter((stat) => stat.count > 0)
        .sort((a, b) => b.count - a.count);

      // Calculate summary
      const totalShifts = tours.length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth =
        year === currentYear
          ? tours.filter((t) => {
              const tourDate = new Date(t.expand?.shiftplan?.date || "");
              return tourDate.getMonth() === currentMonth;
            }).length
          : 0;

      const monthsElapsed = year === currentYear ? currentMonth + 1 : 12;
      const averagePerMonth =
        monthsElapsed > 0 ? Math.round((totalShifts / monthsElapsed) * 10) / 10 : 0;

      return {
        dailyStats,
        vehicleTypeStats,
        summary: {
          totalShifts,
          thisMonth,
          averagePerMonth,
        },
      };
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
