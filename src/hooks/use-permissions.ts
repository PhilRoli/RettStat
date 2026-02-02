"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

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
      const supabase = createClient();

      // Call the RPC function to get all permissions for the user
      const { data, error } = await supabase.rpc("get_user_permissions", {
        p_user_id: user.id,
        p_unit_id: unitId || null,
      } as never); // Temporary type cast until we add RPC function types

      if (error) {
        console.error("Error loading permissions:", error);
        setPermissions(new Set());
        return;
      }

      // Convert array of permission names to Set
      const permissionSet = new Set<Permission>(
        ((data as unknown as { permission_name: string }[]) || []).map(
          (p) => p.permission_name as Permission
        )
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
  }, [user?.id, unitId]);

  const hasPermission = (permission: Permission, checkUnitId?: string): boolean => {
    // If checking a different unit than initially loaded, need to verify via RPC
    // For now, just check against loaded permissions
    // TODO: Implement dynamic unit checking if needed

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
