/**
 * PocketBase Authentication Utilities
 * Helper functions for authentication operations
 */

import { getPb } from "./client";
import type { UserRecord, ProfileRecord } from "./types";

export interface AuthResponse {
  token: string;
  record: UserRecord;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const pb = getPb();
  const authData = await pb.collection("users").authWithPassword(email, password);
  return {
    token: authData.token,
    record: authData.record as unknown as UserRecord,
  };
}

/**
 * Register a new user
 */
export async function signup(
  email: string,
  password: string,
  passwordConfirm: string,
  additionalData?: {
    firstName?: string;
    lastName?: string;
  }
): Promise<UserRecord> {
  const pb = getPb();
  // Create user account
  const user = await pb.collection("users").create<UserRecord>({
    email,
    password,
    passwordConfirm,
    emailVisibility: true,
  });

  // Create associated profile
  if (additionalData?.firstName || additionalData?.lastName) {
    await pb.collection("profiles").create<ProfileRecord>({
      user: user.id,
      first_name: additionalData.firstName || "",
      last_name: additionalData.lastName || "",
      is_active: true,
    });
  }

  return user;
}

/**
 * Logout current user
 */
export function logout(): void {
  getPb().authStore.clear();
  clearAuthCookie();
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await getPb().collection("users").requestPasswordReset(email);
}

/**
 * Confirm password reset with token
 */
export async function confirmPasswordReset(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<void> {
  await getPb().collection("users").confirmPasswordReset(token, password, passwordConfirm);
}

/**
 * Update email address
 */
export async function updateEmail(newEmail: string): Promise<void> {
  const pb = getPb();
  if (!pb.authStore.model?.id) {
    throw new Error("Not authenticated");
  }
  await pb.collection("users").requestEmailChange(newEmail);
}

/**
 * Confirm email change with token
 */
export async function confirmEmailChange(token: string, password: string): Promise<void> {
  await getPb().collection("users").confirmEmailChange(token, password);
}

/**
 * Refresh authentication token
 */
export async function refreshAuth(): Promise<void> {
  await getPb().collection("users").authRefresh();
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): UserRecord | null {
  return getPb().authStore.model as UserRecord | null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getPb().authStore.isValid;
}

/**
 * Get current auth token
 */
export function getAuthToken(): string | null {
  return getPb().authStore.token;
}

/**
 * Sync auth state to a cookie so middleware can read it
 */
export function syncAuthCookie(): void {
  if (typeof document === "undefined") return;

  const pb = getPb();
  if (pb.authStore.isValid && pb.authStore.token && pb.authStore.record) {
    const cookieValue = JSON.stringify({
      token: pb.authStore.token,
      record: pb.authStore.record,
    });
    document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    clearAuthCookie();
  }
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "pb_auth=; path=/; max-age=0; SameSite=Lax";
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (token: string, model: UserRecord | null) => void) {
  return getPb().authStore.onChange((token, model) => {
    callback(token, model as UserRecord | null);
    syncAuthCookie();
  });
}
