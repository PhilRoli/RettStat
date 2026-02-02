"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUnitVehicles(unitId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["vehicles", unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const { data, error } = await supabase
        .from("vehicles")
        .select(
          `
          id,
          call_sign,
          vehicle_type:vehicle_types(id, name, color)
        `
        )
        .or(`primary_unit_id.eq.${unitId},secondary_unit_id.eq.${unitId}`)
        .order("call_sign");

      if (error) throw error;
      return data || [];
    },
    enabled: !!unitId,
  });
}
