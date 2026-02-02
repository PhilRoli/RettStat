"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSyncPendingMutations } from "@/hooks/use-offline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const t = useTranslations("offline");
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-warning/90 text-warning-foreground fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
      <WifiOff className="h-4 w-4" />
      <span>{t("offlineMessage")}</span>
    </div>
  );
}

export function OfflineBadge({ className }: { className?: string }) {
  const t = useTranslations("offline");
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <span
      className={cn(
        "bg-warning text-warning-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      <WifiOff className="h-3 w-3" />
      {t("offline")}
    </span>
  );
}

export function SyncButton({ className }: { className?: string }) {
  const t = useTranslations("offline");
  const isOnline = useOnlineStatus();
  const { syncPending } = useSyncPendingMutations();

  if (!isOnline) return null;

  return (
    <Button variant="ghost" size="sm" onClick={syncPending} className={className}>
      <RefreshCw className="mr-2 h-4 w-4" />
      {t("sync")}
    </Button>
  );
}
