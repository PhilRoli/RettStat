"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pb } from "@/lib/pocketbase";
import type { TourRecord } from "@/lib/pocketbase/types";

type TourInsert = Omit<TourRecord, "id" | "created" | "updated">;
type TourUpdate = Partial<TourInsert>;

export function useCreateTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TourInsert) => pb.collection("tours").create<TourRecord>(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}

export function useUpdateTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TourUpdate }) =>
      pb.collection("tours").update<TourRecord>(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}

export function useDeleteTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("tours").delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}
