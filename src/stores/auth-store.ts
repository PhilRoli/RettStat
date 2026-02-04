"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRecord, ProfileRecord } from "@/lib/pocketbase/types";

interface AuthState {
  user: UserRecord | null;
  profile: ProfileRecord | null;
  isLoading: boolean;
  setUser: (user: UserRecord | null) => void;
  setProfile: (profile: ProfileRecord | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

// SSR-safe storage that returns a no-op storage during server-side rendering
const getStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),

      signOut: () =>
        set({
          user: null,
          profile: null,
        }),
    }),
    {
      name: "rettstat-auth",
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);
