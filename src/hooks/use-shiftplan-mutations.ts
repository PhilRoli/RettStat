"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pb } from "@/lib/pocketbase";
import type { ShiftplanRecord } from "@/lib/pocketbase/types";

type ShiftplanInsert = Omit<ShiftplanRecord, "id" | "created" | "updated">;
type ShiftplanUpdate = Partial<ShiftplanInsert>;

export function useCreateShiftplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShiftplanInsert) =>
      pb.collection("shiftplans").create<ShiftplanRecord>(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftplans"] }),
  });
}

export function useUpdateShiftplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShiftplanUpdate }) =>
      pb.collection("shiftplans").update<ShiftplanRecord>(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftplans"] }),
  });
}

export function useDeleteShiftplan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("shiftplans").delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftplans"] }),
  });
}
