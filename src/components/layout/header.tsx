"use client";

import { UserDropdown } from "./user-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <h1 className="text-primary text-lg font-bold">RettStat</h1>
        </div>
        <div className="hidden md:block" /> {/* Spacer for desktop */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
