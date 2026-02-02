"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
type TourUpdate = Database["public"]["Tables"]["tours"]["Update"];

export function useCreateTour() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: TourInsert) => {
      const { data: tour, error } = await supabase.from("tours").insert(data).select().single();

      if (error) throw error;
      return tour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan"] });
    },
  });
}

export function useUpdateTour() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: TourUpdate & { id: string }) => {
      const { data: tour, error } = await supabase
        .from("tours")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return tour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan"] });
    },
  });
}

export function useDeleteTour() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tours").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan"] });
    },
  });
}
