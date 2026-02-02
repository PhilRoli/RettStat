"use client";

import { useQuery } from "@tanstack/react-query";
import { pb } from "@/lib/pocketbase";
import type { ProfileRecord } from "@/lib/pocketbase/types";

export function useUnitMembers(unitId?: string) {
  return useQuery({
    queryKey: ["unit-members", unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const profiles = await pb.collection("profiles").getFullList<ProfileRecord>({
        filter: `unit="${unitId}" && is_active=true`,
        sort: "last_name",
      });
      return profiles;
    },
    enabled: !!unitId,
  });
}
