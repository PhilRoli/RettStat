"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Home, Calendar, BarChart3, CalendarDays, CalendarCheck, Settings } from "lucide-react";

const navigationItems = [
  { href: "/", icon: Home, label: "home" },
  { href: "/shiftplan", icon: Calendar, label: "shiftplan" },
  { href: "/schedule", icon: CalendarCheck, label: "schedule" },
  { href: "/statistics", icon: BarChart3, label: "statistics" },
  { href: "/events", icon: CalendarDays, label: "events" },
  { href: "/settings", icon: Settings, label: "settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <nav className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navigationItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
