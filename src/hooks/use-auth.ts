"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPb, login, logout, onAuthChange, refreshAuth, syncAuthCookie } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRecord, ProfileRecord } from "@/lib/pocketbase/types";

const AUTH_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    setUser,
    setProfile,
    setLoading,
    signOut: signOutStore,
  } = useAuthStore();
  const router = useRouter();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pb = getPb();
    const currentUser = pb.authStore.model as unknown as UserRecord | null;

    const initAuth = async () => {
      if (currentUser) {
        // User exists in authStore but token may be expired — try refresh
        if (!pb.authStore.isValid) {
          try {
            await refreshAuth();
            syncAuthCookie();
          } catch {
            // Refresh failed — token is truly expired, clear auth
            logout();
            signOutStore();
            setLoading(false);
            return;
          }
        } else {
          // Token is valid, sync cookie
          syncAuthCookie();
        }

        setUser(pb.authStore.model as unknown as UserRecord);

        // Load profile (may not exist yet for new users)
        try {
          const profileData = await pb
            .collection("profiles")
            .getFirstListItem<ProfileRecord>(
              `user="${(pb.authStore.model as unknown as UserRecord).id}"`
            );
          setProfile(profileData);
        } catch {
          setProfile(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();

    // Set up periodic token refresh
    refreshIntervalRef.current = setInterval(async () => {
      if (getPb().authStore.token) {
        try {
          await refreshAuth();
          syncAuthCookie();
        } catch {
          // Refresh failed, session expired
          logout();
          signOutStore();
        }
      }
    }, AUTH_REFRESH_INTERVAL);

    // Listen for auth changes
    const unsubscribe = onAuthChange(async (_token, model) => {
      const authUser = model as UserRecord | null;
      setUser(authUser);

      if (authUser?.id) {
        try {
          const profileData = await pb
            .collection("profiles")
            .getFirstListItem<ProfileRecord>(`user="${authUser.id}"`);
          setProfile(profileData);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [setUser, setProfile, setLoading, signOutStore]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const authData = await login(email, password);
      setUser(authData.record);
      syncAuthCookie();

      // Fetch profile (may not exist yet)
      try {
        const profileData = await getPb()
          .collection("profiles")
          .getFirstListItem<ProfileRecord>(`user="${authData.record.id}"`);
        setProfile(profileData);
      } catch {
        setProfile(null);
      }
      return authData;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    setLoading(true);
    try {
      const { signup } = await import("@/lib/pocketbase");
      const user = await signup(email, password, password, metadata);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    logout();
    signOutStore();
    setLoading(false);
    router.push("/auth/login");
  };

  const resetPassword = async (email: string) => {
    const { requestPasswordReset } = await import("@/lib/pocketbase");
    await requestPasswordReset(email);
  };

  const updatePassword = async (newPassword: string) => {
    if (!user?.id) throw new Error("Not authenticated");
    await getPb().collection("users").update(user.id, { password: newPassword });
  };

  const refreshProfile = async () => {
    if (!user?.id) return;

    try {
      const profileData = await getPb()
        .collection("profiles")
        .getFirstListItem<ProfileRecord>(`user="${user.id}"`);

      setProfile(profileData);
    } catch {
      // Profile may not exist
    }
  };

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user && getPb().authStore.isValid,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };
}
