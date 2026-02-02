"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/use-auth";
import type { PushSubscriptionRecord } from "@/lib/pocketbase/types";

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

function getPermissionState(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermissionState>(getPermissionState);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported" as const;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, requestPermission };
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const isSupported = useMemo(
    () => typeof window !== "undefined" && "serviceWorker" in navigator,
    []
  );

  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setRegistration(reg);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }, [isSupported]);

  return { registration, isSupported };
}

export function usePushSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registration, isSupported } = useServiceWorker();
  const { permission, requestPermission } = useNotificationPermission();

  // Check if user has an active subscription
  const { data: serverSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["push-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const records = await pb
          .collection("push_subscriptions")
          .getList<PushSubscriptionRecord>(1, 1, {
            filter: `user = "${user.id}" && is_active = true`,
          });
        return records.items[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const isSubscribed = !!serverSubscription;

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !user || !VAPID_PUBLIC_KEY) {
        throw new Error("Cannot subscribe: missing requirements");
      }

      // Request permission if not granted
      if (permission !== "granted") {
        const result = await requestPermission();
        if (result !== "granted") {
          throw new Error("Notification permission denied");
        }
      }

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subscriptionJson = subscription.toJSON();

      // Save to PocketBase
      await pb.collection("push_subscriptions").create({
        user: user.id,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
        user_agent: navigator.userAgent,
        is_active: true,
      });

      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
    },
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration || !serverSubscription) {
        throw new Error("No subscription to remove");
      }

      // Get current browser subscription
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Mark as inactive in PocketBase
      await pb.collection("push_subscriptions").update(serverSubscription.id, {
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
    },
  });

  return {
    isSupported,
    isSubscribed,
    isLoading: isLoadingSubscription,
    permission,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    error: subscribeMutation.error || unsubscribeMutation.error,
  };
}
