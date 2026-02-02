"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Database } from "@/types/database";

type UserAssignment = Database["public"]["Tables"]["user_assignments"]["Row"] & {
  units: Database["public"]["Tables"]["units"]["Row"];
  assignments: Database["public"]["Tables"]["assignments"]["Row"];
};

/**
 * Hook to fetch user's active assignments
 * Returns units where the user has assignments
 */
export function useUserAssignments() {
  const user = useAuthStore((state) => state.user);
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("user_assignments")
        .select(
          `
          *,
          units (*),
          assignments (*)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data as unknown as UserAssignment[]) || [];
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to get unique units from user's assignments
 * Returns deduplicated list of units
 */
export function useUserUnits() {
  const { data: assignments, ...query } = useUserAssignments();

  const units = assignments?.reduce(
    (acc, assignment) => {
      if (assignment.units && !acc.find((u) => u.id === assignment.units.id)) {
        acc.push(assignment.units);
      }
      return acc;
    },
    [] as Database["public"]["Tables"]["units"]["Row"][]
  );

  return {
    ...query,
    data: units || [],
  };
}
