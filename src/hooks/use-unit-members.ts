"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type Assignment = {
  profile: Profile | null;
};

export function useUnitMembers(unitId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["unit-members", unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          profile:profiles(
            id,
            first_name,
            last_name
          )
        `
        )
        .eq("unit_id", unitId)
        .eq("status", "active")
        .order("profile(last_name)");

      if (error) throw error;

      // Filter out null profiles and flatten the structure
      return ((data || []) as Assignment[])
        .filter((assignment) => assignment.profile)
        .map((assignment) => assignment.profile!);
    },
    enabled: !!unitId,
  });
}
