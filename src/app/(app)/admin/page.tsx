"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagement } from "@/components/admin/users-management";
import { VehiclesManagement } from "@/components/admin/vehicles-management";
import { UnitsManagement } from "@/components/admin/units-management";
import { QualificationsManagement } from "@/components/admin/qualifications-management";
import { AssignmentsManagement } from "@/components/admin/assignments-management";
import { AbsencesManagement } from "@/components/admin/absences-management";
import { NewsManagement } from "@/components/admin/news-management";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
