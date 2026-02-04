"use client";

import { useQuery } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import { useAuth } from "./use-auth";
import type { UserAssignmentRecord, UnitRecord } from "@/lib/pocketbase/types";

export function useUserAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return getPb()
        .collection("user_assignments")
        .getFullList<UserAssignmentRecord>({
          filter: `user="${user.id}"`,
          expand: "assignment,assignment.unit",
          sort: "-created",
        });
    },
    enabled: !!user?.id,
  });
}

export function useUserUnits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-units", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all assignments for the user with expanded unit data
      const assignments = await getPb()
        .collection("user_assignments")
        .getFullList<
          UserAssignmentRecord & {
            expand?: { assignment?: { unit?: string; expand?: { unit?: UnitRecord } } };
          }
        >({
          filter: `user="${user.id}"`,
          expand: "assignment.unit",
          sort: "-created",
        });

      // Extract unique units from assignments
      const unitMap = new Map<string, UnitRecord>();
      for (const assignment of assignments) {
        const unit = assignment.expand?.assignment?.expand?.unit;
        if (unit && !unitMap.has(unit.id)) {
          unitMap.set(unit.id, unit);
        }
      }

      // If no units from assignments, try getting units directly where user has profile
      if (unitMap.size === 0) {
        // Fallback: get all units the user's profile is associated with
        const profile = await getPb()
          .collection("profiles")
          .getFirstListItem<{ unit?: string }>(`user="${user.id}"`, { expand: "unit" })
          .catch(() => null);

        if (profile?.unit) {
          const unit = await getPb()
            .collection("units")
            .getOne<UnitRecord>(profile.unit)
            .catch(() => null);
          if (unit) {
            unitMap.set(unit.id, unit);
          }
        }
      }

      // If still no units, get all units as fallback (for development)
      if (unitMap.size === 0) {
        const allUnits = await getPb().collection("units").getFullList<UnitRecord>({
          sort: "name",
        });
        return allUnits;
      }

      return Array.from(unitMap.values());
    },
    enabled: !!user?.id,
  });
}
