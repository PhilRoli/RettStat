import PocketBase from "pocketbase";

// Derive PocketBase URL from the current hostname
function getPocketBaseUrl(): string {
  // Server-side: use direct URL (environment variable or default)
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  }

  // Client-side: use Next.js rewrite proxy so the real API URL is hidden
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // In local dev, use direct connection for faster DX
    return "http://127.0.0.1:8090";
  }

  // All deployed environments go through the proxy
  return `${window.location.origin}/pb`;
}

// Lazy-initialized PocketBase client
let pbInstance: PocketBase | null = null;

/**
 * Get the PocketBase client instance (lazy initialization)
 * This ensures the client is created with the correct URL on the client side
 */
export function getPb(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(getPocketBaseUrl());
    pbInstance.autoCancellation(false);
  }
  return pbInstance;
}

// Type-safe collections helper
export const collections = {
  users: "users",
  profiles: "profiles",
  units: "units",
  shiftplans: "shiftplans",
  tours: "tours",
  vehicles: "vehicles",
  vehicleTypes: "vehicle_types",
  assignments: "assignments",
  assignmentCategories: "assignment_categories",
  assignmentDefaultPermissions: "assignment_default_permissions",
  qualifications: "qualifications",
  qualificationCategories: "qualification_categories",
  absences: "absences",
  absenceCategories: "absence_categories",
  tourTypes: "tour_types",
  userAssignments: "user_assignments",
  userQualifications: "user_qualifications",
  userAbsences: "user_absences",
  permissions: "permissions",
  userPermissions: "user_permissions",
  news: "news",
  newsAttachments: "news_attachments",
  newsReadStatus: "news_read_status",
  quickLinks: "quick_links",
  pushSubscriptions: "push_subscriptions",
  eventCategories: "event_categories",
  events: "events",
  eventPositions: "event_positions",
  eventRegistrations: "event_registrations",
  eventGroups: "event_groups",
} as const;

export type Collection = (typeof collections)[keyof typeof collections];
