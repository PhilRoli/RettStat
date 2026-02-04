"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getPb } from "@/lib/pocketbase";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncedAt: string | null;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingChanges: (count: number) => void;
  setLastSynced: (date: string) => void;
  syncNow: () => Promise<void>;
  checkPendingChanges: () => Promise<void>;
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

// Lazy import db functions to avoid SSR issues with IndexedDB
async function getDbFunctions() {
  const { db, getSyncQueueItems, removeSyncQueueItem } = await import("@/lib/db");
  return { db, getSyncQueueItems, removeSyncQueueItem };
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      isSyncing: false,
      pendingChanges: 0,
      lastSyncedAt: null,

      setOnline: (online) => set({ isOnline: online }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setPendingChanges: (count) => set({ pendingChanges: count }),
      setLastSynced: (date) => set({ lastSyncedAt: date }),

      checkPendingChanges: async () => {
        if (typeof window === "undefined") return;
        const { getSyncQueueItems } = await getDbFunctions();
        const items = await getSyncQueueItems();
        set({ pendingChanges: items.length });
      },

      syncNow: async () => {
        if (typeof window === "undefined") return;
        const { isOnline, isSyncing } = get();
        if (!isOnline || isSyncing) return;

        set({ isSyncing: true });

        try {
          const { getSyncQueueItems, removeSyncQueueItem } = await getDbFunctions();
          const items = await getSyncQueueItems();

          for (const item of items) {
            try {
              const collection = getPb().collection(item.table);

              switch (item.operation) {
                case "insert":
                  await collection.create(item.data);
                  break;
                case "update":
                  await collection.update(item.recordId, item.data);
                  break;
                case "delete":
                  await collection.delete(item.recordId);
                  break;
              }

              // Remove from queue on success
              if (item.id) {
                await removeSyncQueueItem(item.id);
              }
            } catch (error) {
              console.error(`Failed to sync item ${item.id}:`, error);
              // Item stays in queue for retry
            }
          }

          // Update pending count
          const remaining = await getSyncQueueItems();
          set({
            pendingChanges: remaining.length,
            lastSyncedAt: new Date().toISOString(),
          });
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "rettstat-sync",
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

// Helper hook for managing offline data
export function useOfflineData<T extends Record<string, unknown>>(
  tableName: "users" | "shifts" | "events" | "news"
) {
  const save = async (data: T & { id: string }) => {
    if (typeof window === "undefined") return;
    const { db, addToSyncQueue } = await import("@/lib/db");
    const table = db[tableName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await table.put(data as any);

    // Add to sync queue
    const existingRecord = await table.get(data.id);
    await addToSyncQueue(tableName, existingRecord ? "update" : "insert", data.id, data);

    // Update pending count
    useSyncStore.getState().checkPendingChanges();
  };

  const remove = async (id: string) => {
    if (typeof window === "undefined") return;
    const { db, addToSyncQueue } = await import("@/lib/db");
    const table = db[tableName];
    await table.delete(id);
    await addToSyncQueue(tableName, "delete", id, {});
    useSyncStore.getState().checkPendingChanges();
  };

  return { save, remove };
}
