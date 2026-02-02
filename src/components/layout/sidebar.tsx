"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Home,
  Calendar,
  BarChart3,
  Users,
  CalendarDays,
  Settings,
  CalendarCheck,
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: Home, label: "home" },
  { href: "/shiftplan", icon: Calendar, label: "shiftplan" },
  { href: "/schedule", icon: CalendarCheck, label: "schedule" },
  { href: "/statistics", icon: BarChart3, label: "statistics" },
  { href: "/events", icon: CalendarDays, label: "events" },
  { href: "/members", icon: Users, label: "members" },
  { href: "/settings", icon: Settings, label: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <aside className="bg-background hidden w-64 flex-col border-r md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-primary text-xl font-bold">RettStat</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
