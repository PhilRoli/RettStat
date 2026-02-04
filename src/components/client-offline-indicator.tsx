"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled to prevent IndexedDB/localStorage issues
const OfflineIndicatorImpl = dynamic(
  () => import("@/components/offline-indicator").then((mod) => mod.OfflineIndicator),
  { ssr: false }
);

export function ClientOfflineIndicator() {
  return <OfflineIndicatorImpl />;
}
