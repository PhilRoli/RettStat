"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Shiftplan = Database["public"]["Tables"]["shiftplans"]["Row"] & {
  tours: (Database["public"]["Tables"]["tours"]["Row"] & {
    vehicle?: Database["public"]["Tables"]["vehicles"]["Row"] | null;
    tour_type?: Database["public"]["Tables"]["tour_types"]["Row"] | null;
    driver?: Database["public"]["Tables"]["profiles"]["Row"] | null;
    lead?: Database["public"]["Tables"]["profiles"]["Row"] | null;
    student?: Database["public"]["Tables"]["profiles"]["Row"] | null;
  })[];
  unit: Database["public"]["Tables"]["units"]["Row"];
  shift_lead: Database["public"]["Tables"]["profiles"]["Row"];
};

interface UseShiftplansParams {
  unitId?: string;
  month: number;
  year: number;
}

/**
 * Hook to fetch shiftplans for a specific unit and month
 * Includes realtime subscriptions for live updates
 */
export function useShiftplans({ unitId, month, year }: UseShiftplansParams) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const query = useQuery({
    queryKey: ["shiftplans", unitId, month, year],
    queryFn: async () => {
      if (!unitId) {
        return [];
      }

      const { data, error } = await supabase
        .from("shiftplans")
        .select(
          `
          *,
          unit:units (*),
          shift_lead:profiles!shiftplans_shift_lead_id_fkey (*),
          tours (
            *,
            vehicle:vehicles (*),
            tour_type:tour_types (*),
            driver:profiles!tours_driver_id_fkey (*),
            lead:profiles!tours_lead_id_fkey (*),
            student:profiles!tours_student_id_fkey (*)
          )
        `
        )
        .eq("unit_id", unitId)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        throw error;
      }

      return (data as unknown as Shiftplan[]) || [];
    },
    enabled: !!unitId,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!unitId) return;

    const channel = supabase
      .channel(`shiftplans-${unitId}-${month}-${year}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shiftplans",
          filter: `unit_id=eq.${unitId}`,
        },
        () => {
          // Invalidate queries when shiftplans change
          queryClient.invalidateQueries({ queryKey: ["shiftplans", unitId, month, year] });
          queryClient.invalidateQueries({ queryKey: ["shiftplan-dates", unitId, month, year] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tours",
        },
        () => {
          // Invalidate queries when tours change
          queryClient.invalidateQueries({ queryKey: ["shiftplans", unitId, month, year] });
          queryClient.invalidateQueries({ queryKey: ["shiftplan"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitId, month, year, queryClient, supabase]);

  return query;
}

/**
 * Hook to get shiftplan dates for a specific month
 * Returns array of dates that have shiftplans
 */
export function useShiftplanDates({ unitId, month, year }: UseShiftplansParams) {
  const { data: shiftplans, ...query } = useShiftplans({ unitId, month, year });

  const dates = shiftplans?.map((shiftplan) => {
    const date = new Date(shiftplan.start_time);
    return date.getDate();
  });

  return {
    ...query,
    data: dates || [],
  };
}

/**
 * Hook to get shiftplan for a specific date
 */
export function useShiftplanByDate({ unitId, date }: { unitId?: string; date: Date }) {
  const { data: shiftplans, ...query } = useShiftplans({
    unitId,
    month: date.getMonth(),
    year: date.getFullYear(),
  });

  const shiftplan = shiftplans?.find((sp) => {
    const spDate = new Date(sp.start_time);
    return spDate.getDate() === date.getDate();
  });

  return {
    ...query,
    data: shiftplan || null,
  };
}
