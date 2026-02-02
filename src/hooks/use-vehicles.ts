"use client";

import { usePocketbaseList } from "@/lib/pocketbase";

export function useVehicles(unitId?: string) {
  return usePocketbaseList("vehicles", {
    filter: unitId ? `unit="${unitId}"` : undefined,
    sort: "call_sign",
    expand: "vehicle_type,unit",
  });
}
