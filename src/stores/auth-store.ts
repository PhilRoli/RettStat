"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      signOut: () =>
        set({
          user: null,
          session: null,
        }),
    }),
    {
      name: "rettstat-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Don't persist session, it will be restored from cookies
        user: state.user,
      }),
    }
  )
);
