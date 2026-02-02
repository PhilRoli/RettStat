"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pb, login, logout, onAuthChange } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRecord, ProfileRecord } from "@/lib/pocketbase/types";

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

  useEffect(() => {
    // Get initial auth state
    const currentUser = pb.authStore.model as UserRecord | null;
    setUser(currentUser);

    // Fetch user profile if authenticated
    const loadProfile = async () => {
      if (currentUser?.id) {
        try {
          const profileData = await pb
            .collection("profiles")
            .getFirstListItem<ProfileRecord>(`user="${currentUser.id}"`);

          setProfile(profileData);
        } catch (error) {
          console.error("Failed to load profile:", error);
          setProfile(null);
        }
      }
      setLoading(false);
    };

    loadProfile();

    // Listen for auth changes
    const unsubscribe = onAuthChange(async (token, model) => {
      const authUser = model as UserRecord | null;
      setUser(authUser);

      // Fetch user profile if authenticated
      if (authUser?.id) {
        try {
          const profileData = await pb
            .collection("profiles")
            .getFirstListItem<ProfileRecord>(`user="${authUser.id}"`);

          setProfile(profileData);
        } catch (error) {
          console.error("Failed to load profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const authData = await login(email, password);
      setUser(authData.record);

      // Fetch profile
      const profileData = await pb
        .collection("profiles")
        .getFirstListItem<ProfileRecord>(`user="${authData.record.id}"`);

      setProfile(profileData);
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
    await pb.collection("users").update(user.id, { password: newPassword });
  };

  const refreshProfile = async () => {
    if (!user?.id) return;

    try {
      const profileData = await pb
        .collection("profiles")
        .getFirstListItem<ProfileRecord>(`user="${user.id}"`);

      setProfile(profileData);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user && pb.authStore.isValid,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };
}
