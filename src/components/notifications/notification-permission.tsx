"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/use-notifications";

export function NotificationPermissionBanner() {
  const t = useTranslations("notifications");
  const [dismissed, setDismissed] = useState(false);
  const [delayComplete, setDelayComplete] = useState(false);
  const { isSupported, isSubscribed, permission, subscribe, isSubscribing } = usePushSubscription();

  const initiallyDismissed = useMemo(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("notification-banner-dismissed") === "true",
    []
  );

  useEffect(() => {
    // Show banner after a short delay to avoid layout shift
    const timer = setTimeout(() => setDelayComplete(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const shouldShow =
    delayComplete &&
    !dismissed &&
    !initiallyDismissed &&
    isSupported &&
    !isSubscribed &&
    permission !== "denied";

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  const handleEnable = () => {
    subscribe();
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div className="bg-primary/10 border-primary/20 fixed right-4 bottom-20 z-50 max-w-sm rounded-lg border p-4 shadow-lg md:bottom-4">
      <div className="flex items-start gap-3">
        <Bell className="text-primary mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{t("enableTitle")}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t("enableDescription")}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleEnable} disabled={isSubscribing}>
              {isSubscribing ? t("enabling") : t("enable")}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              {t("notNow")}
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function NotificationToggle() {
  const t = useTranslations("notifications");
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isSubscribing,
    isUnsubscribing,
  } = usePushSubscription();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 opacity-50">
        <BellOff className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{t("notSupported")}</p>
          <p className="text-muted-foreground text-xs">{t("notSupportedDescription")}</p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3">
        <BellOff className="text-destructive h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{t("blocked")}</p>
          <p className="text-muted-foreground text-xs">{t("blockedDescription")}</p>
        </div>
      </div>
    );
  }

  const isLoading = isSubscribing || isUnsubscribing;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isSubscribed ? <Bell className="text-primary h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        <div>
          <p className="text-sm font-medium">{t("pushNotifications")}</p>
          <p className="text-muted-foreground text-xs">
            {isSubscribed ? t("enabledDescription") : t("disabledDescription")}
          </p>
        </div>
      </div>
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
        disabled={isLoading}
      >
        {isLoading ? t("loading") : isSubscribed ? t("disable") : t("enable")}
      </Button>
    </div>
  );
}
