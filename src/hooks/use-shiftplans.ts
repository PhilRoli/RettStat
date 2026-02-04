"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import type {
  ShiftplanRecord,
  TourRecord,
  VehicleRecord,
  ProfileRecord,
  UnitRecord,
  TourTypeRecord,
} from "@/lib/pocketbase/types";

// Expanded tour with relations
export type TourWithRelations = TourRecord & {
  vehicle?: VehicleRecord | null;
  driver?: ProfileRecord | null;
  lead?: ProfileRecord | null;
  student?: ProfileRecord | null;
  tour_type?: TourTypeRecord | null;
};

// Expanded shiftplan with relations
export type ShiftplanWithRelations = ShiftplanRecord & {
  tours: TourWithRelations[];
  expand?: {
    unit?: UnitRecord;
    shift_lead?: ProfileRecord;
  };
};

interface UseShiftplansParams {
  unitId?: string;
  month: number;
  year: number;
}

export function useShiftplans({ unitId, month, year }: UseShiftplansParams) {
  const queryClient = useQueryClient();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const query = useQuery({
    queryKey: ["shiftplans", unitId, month, year],
    queryFn: async () => {
      if (!unitId) return [];

      const shiftplans = await getPb()
        .collection("shiftplans")
        .getFullList<ShiftplanRecord>({
          filter: `unit="${unitId}" && date>="${startDate.toISOString().split("T")[0]}" && date<="${endDate.toISOString().split("T")[0]}"`,
          expand: "unit,shift_lead",
          sort: "date",
        });

      const shiftplansWithTours = await Promise.all(
        shiftplans.map(async (shiftplan) => {
          const tours = await getPb()
            .collection("tours")
            .getFullList<TourRecord>({
              filter: `shiftplan="${shiftplan.id}"`,
              expand: "vehicle,driver,lead,student,tour_type",
              sort: "start_time",
            });

          // Extract expanded data for each tour
          const toursWithRelations: TourWithRelations[] = tours.map((tour) => {
            // @ts-expect-error - PocketBase expand types
            const expand = tour.expand || {};
            return {
              ...tour,
              vehicle: expand.vehicle || null,
              driver: expand.driver || null,
              lead: expand.lead || null,
              student: expand.student || null,
              tour_type: expand.tour_type || null,
            };
          });

          // @ts-expect-error - PocketBase expand types
          const shiftplanExpand = shiftplan.expand || {};

          return {
            ...shiftplan,
            tours: toursWithRelations,
            expand: {
              unit: shiftplanExpand.unit,
              shift_lead: shiftplanExpand.shift_lead,
            },
          } as ShiftplanWithRelations;
        })
      );

      return shiftplansWithTours;
    },
    enabled: !!unitId,
  });

  useEffect(() => {
    if (!unitId) return;

    getPb()
      .collection("shiftplans")
      .subscribe("*", () => {
        queryClient.invalidateQueries({ queryKey: ["shiftplans", unitId, month, year] });
      });

    getPb()
      .collection("tours")
      .subscribe("*", () => {
        queryClient.invalidateQueries({ queryKey: ["shiftplans", unitId, month, year] });
      });

    return () => {
      getPb().collection("shiftplans").unsubscribe("*");
      getPb().collection("tours").unsubscribe("*");
    };
  }, [unitId, month, year, queryClient]);

  return query;
}

export function useShiftplanDates({ unitId, month, year }: UseShiftplansParams) {
  const { data: shiftplans, ...query } = useShiftplans({ unitId, month, year });
  const dates = shiftplans?.map((sp) => new Date(sp.date).getDate()) || [];
  return { ...query, data: dates };
}

export function useShiftplanByDate({ unitId, date }: { unitId?: string; date: Date }) {
  const { data: shiftplans, ...query } = useShiftplans({
    unitId,
    month: date.getMonth(),
    year: date.getFullYear(),
  });
  const shiftplan = shiftplans?.find((sp) => {
    const spDate = new Date(sp.date);
    return spDate.getDate() === date.getDate();
  });
  return { ...query, data: shiftplan || null };
}
