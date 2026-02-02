"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type ShiftplanInsert = Database["public"]["Tables"]["shiftplans"]["Insert"];
type ShiftplanUpdate = Database["public"]["Tables"]["shiftplans"]["Update"];

export function useCreateShiftplan() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: ShiftplanInsert) => {
      const { data: shiftplan, error } = await supabase
        .from("shiftplans")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return shiftplan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan-dates"] });
    },
  });
}

export function useUpdateShiftplan() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: ShiftplanUpdate & { id: string }) => {
      const { data: shiftplan, error } = await supabase
        .from("shiftplans")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return shiftplan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan"] });
    },
  });
}

export function useDeleteShiftplan() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shiftplans").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftplans"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan-dates"] });
      queryClient.invalidateQueries({ queryKey: ["shiftplan"] });
    },
  });
}
