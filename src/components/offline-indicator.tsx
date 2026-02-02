"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useSyncStore } from "@/stores/sync-store";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingChanges, syncNow } = useSyncStore();

  if (isOnline && pendingChanges === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 left-4 z-50 flex items-center justify-between rounded-lg border p-3 shadow-lg sm:right-4 sm:left-auto sm:w-auto sm:min-w-75",
        isOnline
          ? "border-accent-orange/50 bg-accent-orange/10"
          : "border-destructive/50 bg-destructive/10"
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className={cn("h-4 w-4", isOnline ? "text-accent-orange" : "text-destructive")} />
        <div className="text-sm">
          {!isOnline ? (
            <span className="font-medium">Offline</span>
          ) : (
            <span className="font-medium">{pendingChanges} pending changes</span>
          )}
        </div>
      </div>

      {isOnline && pendingChanges > 0 && (
        <button
          onClick={() => syncNow()}
          disabled={isSyncing}
          className="bg-accent-orange hover:bg-accent-orange/90 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Sync now"}
        </button>
      )}
    </div>
  );
}
