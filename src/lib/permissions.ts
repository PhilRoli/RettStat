// Role types
export type UserRole = "admin" | "manager" | "member";

// Permission types
export type Permission =
  | "shifts:view"
  | "shifts:create"
  | "shifts:edit"
  | "shifts:delete"
  | "events:view"
  | "events:create"
  | "events:edit"
  | "events:delete"
  | "events:assign"
  | "statistics:view:own"
  | "statistics:view:all"
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "qualifications:manage"
  | "assignments:manage"
  | "news:create"
  | "news:edit"
  | "news:delete"
  | "settings:manage";

// Role-to-permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "shifts:view",
    "shifts:create",
    "shifts:edit",
    "shifts:delete",
    "events:view",
    "events:create",
    "events:edit",
    "events:delete",
    "events:assign",
    "statistics:view:own",
    "statistics:view:all",
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "qualifications:manage",
    "assignments:manage",
    "news:create",
    "news:edit",
    "news:delete",
    "settings:manage",
  ],
  manager: [
    "shifts:view",
    "shifts:create",
    "shifts:edit",
    "events:view",
    "events:create",
    "events:edit",
    "events:assign",
    "statistics:view:own",
    "statistics:view:all",
    "users:view",
    "news:create",
    "news:edit",
  ],
  member: ["shifts:view", "events:view", "statistics:view:own", "users:view"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
