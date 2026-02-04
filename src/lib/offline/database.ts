import Dexie, { type EntityTable } from "dexie";

// Offline-cached event data
export interface CachedEvent {
  id: string;
  name: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  synced_at: string;
}

// Offline-cached event position
export interface CachedEventPosition {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  required_qualifications?: string[];
  min_count: number;
  max_count?: number;
  current_participants: number;
  user_registered: boolean;
}

// Pending mutations to sync when back online
export interface PendingMutation {
  id?: number;
  type: "create" | "update" | "delete";
  collection: string;
  record_id?: string;
  data: Record<string, unknown>;
  created_at: string;
}

// Database class
class OfflineDatabase extends Dexie {
  events!: EntityTable<CachedEvent, "id">;
  positions!: EntityTable<CachedEventPosition, "id">;
  mutations!: EntityTable<PendingMutation, "id">;

  constructor() {
    super("rettstat-offline");

    this.version(1).stores({
      events: "id, start_date, end_date, synced_at",
      positions: "id, event_id",
      mutations: "++id, type, collection, created_at",
    });
  }
}

// Lazy-initialized singleton instance (SSR-safe)
let dbInstance: OfflineDatabase | null = null;

function getOfflineDb(): OfflineDatabase {
  if (typeof window === "undefined") {
    throw new Error("Offline database can only be accessed in the browser");
  }
  if (!dbInstance) {
    dbInstance = new OfflineDatabase();
  }
  return dbInstance;
}

// Export a proxy that lazily initializes the database
export const offlineDb = new Proxy({} as OfflineDatabase, {
  get(_, prop) {
    return getOfflineDb()[prop as keyof OfflineDatabase];
  },
});

// Helper to clear old cached data
export async function clearOldCache(daysOld = 7) {
  if (typeof window === "undefined") return;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const cutoffStr = cutoff.toISOString();

  await offlineDb.events.where("end_date").below(cutoffStr).delete();
}

// Helper to check if we have cached data
export async function hasCachedEvents(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const count = await offlineDb.events.count();
  return count > 0;
}
