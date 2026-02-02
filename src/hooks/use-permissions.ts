"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { pb } from "@/lib/pocketbase";
import type { UserPermissionRecord, PermissionRecord } from "@/lib/pocketbase/types";

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

interface UsePermissionsReturn {
  permissions: Set<Permission>;
  hasPermission: (permission: Permission, unitId?: string) => boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to check user permissions
 * Loads all permissions for the current user and provides helpers to check them
 */
export function usePermissions(unitId?: string): UsePermissionsReturn {
  const user = useAuthStore((state) => state.user);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = async () => {
    if (!user?.id) {
      setPermissions(new Set());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Build filter for user permissions
      let filter = `user="${user.id}"`;
      if (unitId) {
        // Include permissions for specific unit or global (no unit)
        filter = `user="${user.id}" && (unit="${unitId}" || unit="")`;
      }

      // Fetch user permissions with expanded permission names
      const userPermissions = await pb
        .collection("user_permissions")
        .getFullList<UserPermissionRecord & { expand?: { permission?: PermissionRecord } }>({
          filter,
          expand: "permission",
        });

      // Extract permission names
      const permissionSet = new Set<Permission>(
        userPermissions
          .map((up) => up.expand?.permission?.name as Permission)
          .filter((name): name is Permission => !!name)
      );

      setPermissions(permissionSet);
    } catch (error) {
      console.error("Error loading permissions:", error);
      setPermissions(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, unitId]);

  const hasPermission = (permission: Permission): boolean => {
    // System admin has all permissions
    if (permissions.has("system_admin")) {
      return true;
    }

    return permissions.has(permission);
  };

  return {
    permissions,
    hasPermission,
    isLoading,
    refresh: loadPermissions,
  };
}

/**
 * Hook to check a single permission
 * Simpler interface when you only need to check one permission
 */
export function useHasPermission(
  permission: Permission,
  unitId?: string
): { hasPermission: boolean; isLoading: boolean } {
  const { hasPermission, isLoading } = usePermissions(unitId);
  return {
    hasPermission: hasPermission(permission, unitId),
    isLoading,
  };
}

/**
 * Hook to check if user is system admin
 */
export function useIsSystemAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { hasPermission, isLoading } = usePermissions();
  return {
    isAdmin: hasPermission("system_admin"),
    isLoading,
  };
}
