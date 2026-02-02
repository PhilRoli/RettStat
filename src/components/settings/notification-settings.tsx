"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { useToast } from "@/hooks/use-toast";

type NotificationPreferences = {
  email: {
    shifts: boolean;
    events: boolean;
    news: boolean;
  };
  push: {
    shifts: boolean;
    events: boolean;
    news: boolean;
  };
};

export function NotificationSettings() {
  const t = useTranslations("settings.notifications");
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      shifts: true,
      events: true,
      news: true,
    },
    push: {
      shifts: true,
      events: true,
      news: true,
    },
  });

  useEffect(() => {
    if (profile?.notification_preferences) {
      setPreferences(profile.notification_preferences);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.id) throw new Error("Profile not found");

      await pb.collection("profiles").update(profile.id, {
        notification_preferences: preferences,
      });

      await refreshProfile();

      toast({
        title: t("successTitle"),
        description: t("successDescription"),
      });
    } catch (error) {
      console.error("Notification settings error:", error);
      toast({
        variant: "destructive",
        title: t("errorTitle"),
        description: t("errorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (type: "email" | "push", key: "shifts" | "events" | "news") => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key],
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("emailTitle")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-shifts">{t("shifts")}</Label>
              <p className="text-muted-foreground text-sm">{t("shiftsDescription")}</p>
            </div>
            <Switch
              id="email-shifts"
              checked={preferences.email.shifts}
              onCheckedChange={() => handleToggle("email", "shifts")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-events">{t("events")}</Label>
              <p className="text-muted-foreground text-sm">{t("eventsDescription")}</p>
            </div>
            <Switch
              id="email-events"
              checked={preferences.email.events}
              onCheckedChange={() => handleToggle("email", "events")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-news">{t("news")}</Label>
              <p className="text-muted-foreground text-sm">{t("newsDescription")}</p>
            </div>
            <Switch
              id="email-news"
              checked={preferences.email.news}
              onCheckedChange={() => handleToggle("email", "news")}
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("pushTitle")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-shifts">{t("shifts")}</Label>
              <p className="text-muted-foreground text-sm">{t("shiftsDescription")}</p>
            </div>
            <Switch
              id="push-shifts"
              checked={preferences.push.shifts}
              onCheckedChange={() => handleToggle("push", "shifts")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-events">{t("events")}</Label>
              <p className="text-muted-foreground text-sm">{t("eventsDescription")}</p>
            </div>
            <Switch
              id="push-events"
              checked={preferences.push.events}
              onCheckedChange={() => handleToggle("push", "events")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-news">{t("news")}</Label>
              <p className="text-muted-foreground text-sm">{t("newsDescription")}</p>
            </div>
            <Switch
              id="push-news"
              checked={preferences.push.news}
              onCheckedChange={() => handleToggle("push", "news")}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("saveButton")}
      </Button>
    </form>
  );
}
