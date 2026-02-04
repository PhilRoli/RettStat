"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/use-auth";
import type {
  TourRecord,
  ShiftplanRecord,
  VehicleRecord,
  AbsenceRecord,
  AbsenceCategoryRecord,
} from "@/lib/pocketbase/types";

// Extended tour type with relations
export interface MyTourWithExpand extends TourRecord {
  expand?: {
    shiftplan?: ShiftplanRecord;
    vehicle?: VehicleRecord & {
      expand?: {
        vehicle_type?: { id: string; name: string };
      };
    };
  };
}

// Extended absence type
export interface MyAbsenceWithExpand extends AbsenceRecord {
  expand?: {
    category?: AbsenceCategoryRecord;
  };
}

// Fetch personal shifts for a date range
export function useMyShifts(startDate: string, endDate: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-shifts", profile?.id, startDate, endDate],
    queryFn: async () => {
      if (!profile?.id) return [];

      const tours = await getPb()
        .collection("tours")
        .getFullList<MyTourWithExpand>({
          filter: `(driver = "${profile.id}" || lead = "${profile.id}" || student = "${profile.id}") && shiftplan.date >= "${startDate}" && shiftplan.date <= "${endDate}"`,
          expand: "shiftplan,vehicle.vehicle_type",
          sort: "shiftplan.date,start_time",
        });

      return tours;
    },
    enabled: !!profile?.id,
  });
}

// Fetch personal absences
export function useMyAbsences(year?: number) {
  const { user } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["my-absences", user?.id, currentYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const absences = await getPb()
        .collection("absences")
        .getFullList<MyAbsenceWithExpand>({
          filter: `user = "${user.id}" && start_date >= "${startDate}" && end_date <= "${endDate}"`,
          expand: "category",
          sort: "-start_date",
        });

      return absences;
    },
    enabled: !!user?.id,
  });
}

// Fetch absence categories
export function useAbsenceCategories() {
  return useQuery({
    queryKey: ["absence-categories"],
    queryFn: async () => {
      return getPb().collection("absence_categories").getFullList<AbsenceCategoryRecord>({
        sort: "name",
      });
    },
  });
}

// Create absence request
export function useCreateAbsenceRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      category: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      return getPb()
        .collection("absences")
        .create<AbsenceRecord>({
          ...data,
          user: user.id,
          status: "pending",
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-absences"] });
    },
  });
}

// Generate iCal content for shifts
export function generateICalContent(
  tours: MyTourWithExpand[],
  title: string = "My Shifts"
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RettStat//Shifts//EN",
    `X-WR-CALNAME:${title}`,
  ];

  for (const tour of tours) {
    if (!tour.expand?.shiftplan) continue;

    const date = tour.expand.shiftplan.date.replace(/-/g, "");
    const startTime = tour.start_time.replace(/:/g, "").substring(0, 4) + "00";
    const endTime = tour.end_time.replace(/:/g, "").substring(0, 4) + "00";

    const vehicleName = tour.expand?.vehicle?.call_sign || "";
    const vehicleType = tour.expand?.vehicle?.expand?.vehicle_type?.name || "";
    const summary = vehicleName ? `${vehicleType} - ${vehicleName}` : tour.name || "Shift";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${tour.id}@rettstat`);
    lines.push(`DTSTART:${date}T${startTime}`);
    lines.push(`DTEND:${date}T${endTime}`);
    lines.push(`SUMMARY:${summary}`);
    if (tour.notes) {
      lines.push(`DESCRIPTION:${tour.notes.replace(/\n/g, "\\n")}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Download iCal file
export function downloadICal(tours: MyTourWithExpand[], filename: string = "shifts.ics") {
  const content = generateICalContent(tours);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
