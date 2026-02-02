"use client";

import { useAuth } from "@/hooks/use-auth";
import { useIsSystemAdmin } from "@/hooks/use-permissions";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Shield, LogOut } from "lucide-react";
import Link from "next/link";

export function UserDropdown() {
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsSystemAdmin();
  const t = useTranslations("userDropdown");

  if (!profile) return null;

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "";
  const initials =
    profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : profile.email
        ? profile.email[0].toUpperCase()
        : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:ring-primary rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{fullName}</p>
            <p className="text-muted-foreground text-xs leading-none">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("settings")}</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>{t("adminPanel")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
