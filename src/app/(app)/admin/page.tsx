"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

const UsersManagement = dynamic(
  () => import("@/components/admin/users-management").then((m) => ({ default: m.UsersManagement })),
  { loading: () => <TabSkeleton /> }
);

const VehiclesManagement = dynamic(
  () =>
    import("@/components/admin/vehicles-management").then((m) => ({
      default: m.VehiclesManagement,
    })),
  { loading: () => <TabSkeleton /> }
);

const UnitsManagement = dynamic(
  () => import("@/components/admin/units-management").then((m) => ({ default: m.UnitsManagement })),
  { loading: () => <TabSkeleton /> }
);

const QualificationsManagement = dynamic(
  () =>
    import("@/components/admin/qualifications-management").then((m) => ({
      default: m.QualificationsManagement,
    })),
  { loading: () => <TabSkeleton /> }
);

const AssignmentsManagement = dynamic(
  () =>
    import("@/components/admin/assignments-management").then((m) => ({
      default: m.AssignmentsManagement,
    })),
  { loading: () => <TabSkeleton /> }
);

const AbsencesManagement = dynamic(
  () =>
    import("@/components/admin/absences-management").then((m) => ({
      default: m.AbsencesManagement,
    })),
  { loading: () => <TabSkeleton /> }
);

const NewsManagement = dynamic(
  () => import("@/components/admin/news-management").then((m) => ({ default: m.NewsManagement })),
  { loading: () => <TabSkeleton /> }
);

export default function AdminPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();

  const canAccessAdmin =
    hasPermission("manage_members") ||
    hasPermission("manage_vehicles") ||
    hasPermission("manage_units") ||
    hasPermission("manage_qualifications") ||
    hasPermission("manage_assignments") ||
    hasPermission("manage_news") ||
    hasPermission("system_admin");

  useEffect(() => {
    if (!isLoading && !canAccessAdmin) {
      router.push("/");
    }
  }, [isLoading, canAccessAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null;
  }

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
          <TabsTrigger value="vehicles">{t("tabs.vehicles")}</TabsTrigger>
          <TabsTrigger value="units">{t("tabs.units")}</TabsTrigger>
          <TabsTrigger value="qualifications">{t("tabs.qualifications")}</TabsTrigger>
          <TabsTrigger value="assignments">{t("tabs.assignments")}</TabsTrigger>
          <TabsTrigger value="absences">{t("tabs.absences")}</TabsTrigger>
          <TabsTrigger value="news">{t("tabs.news")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <VehiclesManagement />
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <UnitsManagement />
        </TabsContent>

        <TabsContent value="qualifications" className="mt-6">
          <QualificationsManagement />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <AssignmentsManagement />
        </TabsContent>

        <TabsContent value="absences" className="mt-6">
          <AbsencesManagement />
        </TabsContent>

        <TabsContent value="news" className="mt-6">
          <NewsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
