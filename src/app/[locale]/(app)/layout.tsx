"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";
import { NotificationPermissionBanner } from "@/components/notifications";
import { OfflineIndicator } from "@/components/offline";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Save current URL so login can redirect back
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== "/" && currentPath !== "/auth/login") {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
        }
      }
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          <p className="text-muted-foreground text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AppShell>
          <OfflineIndicator />
          {children}
          <Toaster />
          <NotificationPermissionBanner />
        </AppShell>
      </ThemeProvider>
    </QueryProvider>
  );
}
