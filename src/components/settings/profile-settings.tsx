"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/types/database";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export function ProfileSettings() {
  const t = useTranslations("settings.profile");
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Update profile
      const profileUpdate: ProfileUpdate = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user!.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) throw emailError;

        toast({
          title: t("emailUpdateTitle"),
          description: t("emailUpdateDescription"),
        });
      }

      await refreshProfile();

      toast({
        title: t("successTitle"),
        description: t("successDescription"),
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: t("errorTitle"),
        description: t("errorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const supabase = createClient();

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile
      const avatarUpdate: ProfileUpdate = {
        avatar_url: publicUrl,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update(avatarUpdate)
        .eq("id", user!.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: t("avatarSuccessTitle"),
        description: t("avatarSuccessDescription"),
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: t("avatarErrorTitle"),
        description: t("avatarErrorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="avatar" className="cursor-pointer">
            <div className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md border px-4 py-2">
              <Upload className="h-4 w-4" />
              <span>{t("uploadAvatar")}</span>
            </div>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={loading}
            />
          </Label>
          <p className="text-muted-foreground mt-1 text-sm">{t("avatarHint")}</p>
        </div>
      </div>

      {/* Name */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <p className="text-muted-foreground text-sm">{t("emailHint")}</p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+43 123 456789"
        />
      </div>

      {/* Service ID */}
      <div className="space-y-2">
        <Label htmlFor="serviceId">{t("serviceId")}</Label>
        <Input id="serviceId" value={profile?.service_id || ""} disabled />
        <p className="text-muted-foreground text-sm">{t("serviceIdHint")}</p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("saveButton")}
      </Button>
    </form>
  );
}
