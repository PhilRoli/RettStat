"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import type { ShiftplanRecord } from "@/lib/pocketbase/types";

type ShiftplanInsert = Omit<ShiftplanRecord, "id" | "created" | "updated">;
type ShiftplanUpdate = Partial<ShiftplanInsert>;

export function useCreateShiftplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShiftplanInsert) =>
      getPb().collection("shiftplans").create<ShiftplanRecord>(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftplans"] }),
  });
}

export function useUpdateShiftplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShiftplanUpdate }) =>
      getPb().collection("shiftplans").update<ShiftplanRecord>(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftplans"] }),
  });
}

export function useDeleteShiftplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => getPb().collection("shiftplans").delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftplans"] }),
  });
}
