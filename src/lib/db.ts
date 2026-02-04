// NOTE: Dexie is imported dynamically to avoid SSR issues
// The import happens only when getDb() is called in the browser
import type { EntityTable } from "dexie";

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

// Type for the database instance
interface RettStatDatabaseType {
  users: EntityTable<CachedUser, "id">;
  shifts: EntityTable<CachedShift, "id">;
  events: EntityTable<CachedEvent, "id">;
  news: EntityTable<CachedNews, "id">;
  syncQueue: EntityTable<SyncQueueItem, "id">;
  settings: EntityTable<AppSettings, "key">;
}

// Lazy-initialized singleton instance (SSR-safe)
let dbInstance: RettStatDatabaseType | null = null;

async function createRettStatDatabase(): Promise<RettStatDatabaseType> {
  const Dexie = (await import("dexie")).default;

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

  return new RettStatDatabase() as unknown as RettStatDatabaseType;
}

async function getDb(): Promise<RettStatDatabaseType> {
  if (typeof window === "undefined") {
    throw new Error("Database can only be accessed in the browser");
  }
  if (!dbInstance) {
    dbInstance = await createRettStatDatabase();
  }
  return dbInstance;
}

// Export a proxy that lazily initializes the database
// For backwards compatibility - exports a proxy that throws helpful error
export const db = new Proxy({} as RettStatDatabaseType, {
  get() {
    throw new Error("db cannot be accessed synchronously. Use async imports or getDb() instead.");
  },
});

// Helper functions for sync queue
export async function addToSyncQueue(
  table: string,
  operation: "insert" | "update" | "delete",
  recordId: string,
  data: Record<string, unknown>
) {
  const database = await getDb();
  await database.syncQueue.add({
    table,
    operation,
    recordId,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
}

export async function getSyncQueueItems() {
  const database = await getDb();
  return database.syncQueue.toArray();
}

export async function removeSyncQueueItem(id: number) {
  const database = await getDb();
  await database.syncQueue.delete(id);
}

export async function incrementRetryCount(id: number) {
  const database = await getDb();
  await database.syncQueue.update(id, {
    retryCount: (await database.syncQueue.get(id))!.retryCount + 1,
  });
}

// Helper for settings
export async function getSetting(key: string): Promise<string | undefined> {
  const database = await getDb();
  const setting = await database.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string) {
  const database = await getDb();
  await database.settings.put({ key, value });
}
