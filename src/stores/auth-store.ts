"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import type { UserRole, Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

interface UserProfile {
  role: UserRole;
  full_name: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),

      signOut: () =>
        set({
          user: null,
          session: null,
          profile: null,
        }),

      hasPermission: (permission: Permission) => {
        const { profile } = get();
        if (!profile) return false;
        return hasPermission(profile.role, permission);
      },
    }),
    {
      name: "rettstat-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Don't persist session, it will be restored from cookies
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);
