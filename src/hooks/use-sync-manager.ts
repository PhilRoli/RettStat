"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/stores/sync-store";

export function useSyncManager() {
  const { setOnline, syncNow, checkPendingChanges, isOnline, isSyncing, pendingChanges } =
    useSyncStore();

  useEffect(() => {
    // Check initial pending changes
    checkPendingChanges();

    // Set up online/offline listeners
    const handleOnline = () => {
      setOnline(true);
      // Sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    setOnline(navigator.onLine);

    // Sync on mount if online
    if (navigator.onLine) {
      syncNow();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline, syncNow, checkPendingChanges]);

  return {
    isOnline,
    isSyncing,
    pendingChanges,
    syncNow,
  };
}
