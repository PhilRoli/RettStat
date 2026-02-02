/**
 * @deprecated Permission system v3: This file is deprecated and will be removed.
 * Use the new permission system from @/hooks/use-permissions instead.
 *
 * Migration guide:
 * - Import { usePermissions, useHasPermission } from "@/hooks/use-permissions"
 * - Check permissions using hasPermission(permission, unitId) instead of role-based checks
 * - System uses granular permissions with unit-level inheritance
 */

// Legacy types kept for backward compatibility during migration
export type UserRole = "admin" | "manager" | "member";

// New permission types (matching database schema v3)
export type Permission =
  | "view_shiftplans"
  | "edit_shiftplans"
  | "view_statistics"
  | "view_events"
  | "create_events"
  | "manage_events"
  | "view_members"
  | "manage_members"
  | "manage_qualifications"
  | "manage_assignments"
  | "manage_vehicles"
  | "manage_units"
  | "manage_news"
  | "system_admin";

/**
 * @deprecated Use usePermissions hook instead
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  console.warn("hasPermission with role parameter is deprecated. Use usePermissions hook instead.");
  // Fallback mapping for backward compatibility
  if (role === "admin") return true;
  return false;
}

/**
 * @deprecated Use usePermissions hook instead
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  console.warn(
    "hasAnyPermission with role parameter is deprecated. Use usePermissions hook instead."
  );
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * @deprecated Use usePermissions hook instead
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  console.warn(
    "hasAllPermissions with role parameter is deprecated. Use usePermissions hook instead."
  );
  return permissions.every((permission) => hasPermission(role, permission));
}
