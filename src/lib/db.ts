import Dexie, { type EntityTable } from "dexie";

// Define interfaces for offline storage
export interface CachedUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  updatedAt: string;
}

export interface CachedShift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  updatedAt: string;
}

export interface CachedEvent {
  id: string;
  name: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  status: "draft" | "published" | "cancelled" | "completed";
  updatedAt: string;
}

export interface CachedNews {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishedAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  operation: "insert" | "update" | "delete";
  recordId: string;
  data: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

export interface AppSettings {
  key: string;
  value: string;
}

// Define the database
class RettStatDatabase extends Dexie {
  users!: EntityTable<CachedUser, "id">;
  shifts!: EntityTable<CachedShift, "id">;
  events!: EntityTable<CachedEvent, "id">;
  news!: EntityTable<CachedNews, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  settings!: EntityTable<AppSettings, "key">;

  constructor() {
    super("RettStatDB");

    this.version(1).stores({
      users: "id, email, role, updatedAt",
      shifts: "id, userId, date, status, updatedAt",
      events: "id, date, status, updatedAt",
      news: "id, publishedAt, updatedAt",
      syncQueue: "++id, table, operation, recordId, createdAt",
      settings: "key",
    });
  }
}

// Create singleton instance
export const db = new RettStatDatabase();

// Helper functions for sync queue
export async function addToSyncQueue(
  table: string,
  operation: "insert" | "update" | "delete",
  recordId: string,
  data: Record<string, unknown>
) {
  await db.syncQueue.add({
    table,
    operation,
    recordId,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
}

export async function getSyncQueueItems() {
  return db.syncQueue.toArray();
}

export async function removeSyncQueueItem(id: number) {
  await db.syncQueue.delete(id);
}

export async function incrementRetryCount(id: number) {
  await db.syncQueue.update(id, {
    retryCount: (await db.syncQueue.get(id))!.retryCount + 1,
  });
}

// Helper for settings
export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string) {
  await db.settings.put({ key, value });
}
