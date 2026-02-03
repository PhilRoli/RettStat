/**
 * PocketBase React Query Hooks
 * Base hooks for querying and mutating PocketBase data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pb } from "./client";
import type { RecordType, CollectionRecords } from "./types";
import { ClientResponseError } from "pocketbase";

// Query key factory for consistent cache keys
export const pbKeys = {
  all: ["pocketbase"] as const,
  collection: (name: string) => [...pbKeys.all, "collection", name] as const,
  list: (name: string, filter?: string) => [...pbKeys.collection(name), "list", filter] as const,
  detail: (name: string, id: string) => [...pbKeys.collection(name), "detail", id] as const,
  auth: () => [...pbKeys.all, "auth"] as const,
};

// Base query hook for fetching a list of records
export function usePocketbaseList<T extends keyof CollectionRecords>(
  collection: T,
  options?: {
    filter?: string;
    sort?: string;
    expand?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: pbKeys.list(collection, options?.filter),
    queryFn: async () => {
      const records = await pb.collection(collection).getFullList<RecordType<T>>({
        filter: options?.filter,
        sort: options?.sort,
        expand: options?.expand,
      });
      return records;
    },
    enabled: options?.enabled,
  });
}

// Base query hook for fetching a single record
export function usePocketbaseOne<T extends keyof CollectionRecords>(
  collection: T,
  id: string | undefined,
  options?: {
    expand?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: pbKeys.detail(collection, id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const record = await pb.collection(collection).getOne<RecordType<T>>(id, {
        expand: options?.expand,
      });
      return record;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

// Base mutation hook for creating records
export function usePocketbaseCreate<T extends keyof CollectionRecords>(collection: T) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<RecordType<T>>) => {
      const record = await pb.collection(collection).create<RecordType<T>>(data);
      return record;
    },
    onSuccess: () => {
      // Invalidate list queries for this collection
      queryClient.invalidateQueries({ queryKey: pbKeys.collection(collection) });
    },
  });
}

// Base mutation hook for updating records
export function usePocketbaseUpdate<T extends keyof CollectionRecords>(collection: T) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RecordType<T>> }) => {
      const record = await pb.collection(collection).update<RecordType<T>>(id, data);
      return record;
    },
    onSuccess: (data) => {
      // Invalidate list and detail queries
      queryClient.invalidateQueries({ queryKey: pbKeys.collection(collection) });
      queryClient.setQueryData(pbKeys.detail(collection, data.id), data);
    },
  });
}

// Base mutation hook for deleting records
export function usePocketbaseDelete<T extends keyof CollectionRecords>(collection: T) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await pb.collection(collection).delete(id);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate list queries and remove detail query
      queryClient.invalidateQueries({ queryKey: pbKeys.collection(collection) });
      queryClient.removeQueries({ queryKey: pbKeys.detail(collection, id) });
    },
  });
}

// Error handler utility
export function handlePocketbaseError(error: unknown): string {
  if (error instanceof ClientResponseError) {
    // Handle specific error codes
    if (error.status === 404) {
      return "Record not found";
    }
    if (error.status === 403) {
      return "You don't have permission to perform this action";
    }
    if (error.status === 400) {
      // Try to extract field-specific errors
      const fieldErrors = error.data?.data;
      if (fieldErrors) {
        const firstError = Object.values(fieldErrors)[0] as { message: string };
        return firstError?.message || error.message;
      }
      return error.message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}

// Auth state hook
export function usePocketbaseAuth() {
  return useQuery({
    queryKey: pbKeys.auth(),
    queryFn: () => {
      return {
        isValid: pb.authStore.isValid,
        token: pb.authStore.token,
        model: pb.authStore.model,
      };
    },
    // Check auth state frequently
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  });
}
