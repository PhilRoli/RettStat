"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { db, addToSyncQueue, getSyncQueueItems, removeSyncQueueItem } from "@/lib/db";
import { pb } from "@/lib/pocketbase";

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
        const items = await getSyncQueueItems();
        set({ pendingChanges: items.length });
      },

      syncNow: async () => {
        const { isOnline, isSyncing } = get();
        if (!isOnline || isSyncing) return;

        set({ isSyncing: true });

        try {
          const items = await getSyncQueueItems();

          for (const item of items) {
            try {
              const collection = pb.collection(item.table);

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
      storage: createJSONStorage(() => localStorage),
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
    const table = db[tableName];
    await table.delete(id);
    await addToSyncQueue(tableName, "delete", id, {});
    useSyncStore.getState().checkPendingChanges();
  };

  return { save, remove };
}
