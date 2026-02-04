// NOTE: Dexie is imported dynamically to avoid SSR issues
// The import happens only when getOfflineDb() is called in the browser
import type { Table } from "dexie";

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

// Type for the database instance (lazy-loaded)
interface OfflineDatabaseType {
  events: {
    where: (field: string) => {
      aboveOrEqual: (value: string) => { sortBy: (field: string) => Promise<CachedEvent[]> };
      below: (value: string) => { delete: () => Promise<number> };
      equals: (value: string) => { toArray: () => Promise<CachedEventPosition[]> };
    };
    bulkPut: (items: CachedEvent[]) => Promise<void>;
    count: () => Promise<number>;
  };
  positions: {
    where: (field: string) => {
      equals: (value: string) => { toArray: () => Promise<CachedEventPosition[]> };
    };
    bulkPut: (items: CachedEventPosition[]) => Promise<void>;
  };
  mutations: {
    add: (item: Omit<PendingMutation, "id">) => Promise<number>;
    toArray: () => Promise<PendingMutation[]>;
    delete: (id: number) => Promise<void>;
  };
}

// Lazy-initialized singleton instance (SSR-safe)
let dbInstance: OfflineDatabaseType | null = null;

async function createOfflineDatabase(): Promise<OfflineDatabaseType> {
  const Dexie = (await import("dexie")).default;

  class OfflineDatabase extends Dexie {
    events!: Table<CachedEvent, string>;
    positions!: Table<CachedEventPosition, string>;
    mutations!: Table<PendingMutation, number>;

    constructor() {
      super("rettstat-offline");

      this.version(1).stores({
        events: "id, start_date, end_date, synced_at",
        positions: "id, event_id",
        mutations: "++id, type, collection, created_at",
      });
    }
  }

  return new OfflineDatabase() as unknown as OfflineDatabaseType;
}

export async function getOfflineDb(): Promise<OfflineDatabaseType> {
  if (typeof window === "undefined") {
    throw new Error("Offline database can only be accessed in the browser");
  }
  if (!dbInstance) {
    dbInstance = await createOfflineDatabase();
  }
  return dbInstance;
}

// For backwards compatibility - exports a proxy that throws helpful error
// Use getOfflineDb() instead for async access
export const offlineDb = new Proxy({} as OfflineDatabaseType, {
  get() {
    throw new Error("offlineDb cannot be accessed synchronously. Use getOfflineDb() instead.");
  },
});

// Helper to clear old cached data
export async function clearOldCache(daysOld = 7) {
  if (typeof window === "undefined") return;
  const db = await getOfflineDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const cutoffStr = cutoff.toISOString();

  await db.events.where("end_date").below(cutoffStr).delete();
}

// Helper to check if we have cached data
export async function hasCachedEvents(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const db = await getOfflineDb();
  const count = await db.events.count();
  return count > 0;
}
