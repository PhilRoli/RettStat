import PocketBase from "pocketbase";

// Derive PocketBase URL from the current hostname
function getPocketBaseUrl(): string {
  // Server-side: use environment variable if set
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  }

  // Client-side: derive from hostname
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://127.0.0.1:8090";
  }

  if (hostname === "dev.rettstat.at") {
    return "https://api-dev.rettstat.at";
  }

  // Default production: rettstat.at -> api.rettstat.at
  return `https://api.${hostname}`;
}

// Create PocketBase client instance
export const pb = new PocketBase(getPocketBaseUrl());

// Disable auto-cancellation for SSR
pb.autoCancellation(false);

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
} as const;

export type Collection = (typeof collections)[keyof typeof collections];
