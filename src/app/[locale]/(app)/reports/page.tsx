"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileSpreadsheet, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPb } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateShiftsCSV, downloadCSV, generateStatsSummaryCSV } from "@/lib/export";
import type {
  TourRecord,
  VehicleRecord,
  ProfileRecord,
  VehicleTypeRecord,
} from "@/lib/pocketbase/types";

interface TourWithExpand extends TourRecord {
  expand?: {
    vehicle?: VehicleRecord & {
      expand?: {
        vehicle_type?: VehicleTypeRecord;
      };
    };
    shiftplan?: { date: string };
    driver?: ProfileRecord;
    lead?: ProfileRecord;
    student?: ProfileRecord;
  };
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const { user, profile } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "all", label: t("allMonths") },
    { value: "1", label: t("months.january") },
    { value: "2", label: t("months.february") },
    { value: "3", label: t("months.march") },
    { value: "4", label: t("months.april") },
    { value: "5", label: t("months.may") },
    { value: "6", label: t("months.june") },
    { value: "7", label: t("months.july") },
    { value: "8", label: t("months.august") },
    { value: "9", label: t("months.september") },
    { value: "10", label: t("months.october") },
    { value: "11", label: t("months.november") },
    { value: "12", label: t("months.december") },
  ];

  // Fetch user's tours for export
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["export-tours", user?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!user) return [];

      let startDate: string;
      let endDate: string;

      if (selectedMonth === "all") {
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
      } else {
        const month = parseInt(selectedMonth);
        const lastDay = new Date(selectedYear, month, 0).getDate();
        startDate = `${selectedYear}-${month.toString().padStart(2, "0")}-01`;
        endDate = `${selectedYear}-${month.toString().padStart(2, "0")}-${lastDay}`;
      }

      const filter = `(driver = "${user.id}" || lead = "${user.id}" || student = "${user.id}") && shiftplan.date >= "${startDate}" && shiftplan.date <= "${endDate}"`;

      const pb = getPb();
      return pb.collection("tours").getFullList<TourWithExpand>({
        filter,
        expand: "vehicle.vehicle_type,shiftplan,driver,lead,student",
        sort: "shiftplan.date,start_time",
      });
    },
    enabled: !!user,
  });

  const handleExportShifts = async () => {
    setIsExporting(true);
    try {
      const csv = generateShiftsCSV(tours, { dateFormat: "DE" });
      const period =
        selectedMonth === "all"
          ? selectedYear
          : `${selectedYear}-${selectedMonth.padStart(2, "0")}`;
      downloadCSV(csv, `shifts-${profile?.last_name || "export"}-${period}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportStats = async () => {
    setIsExporting(true);
    try {
      // Calculate stats from tours
      const thisMonth = new Date().getMonth() + 1;
      const thisMonthCount = tours.filter((t) => {
        const date = new Date(t.expand?.shiftplan?.date || t.created);
        return date.getMonth() + 1 === thisMonth;
      }).length;

      const byVehicleType: Record<string, number> = {};
      tours.forEach((tour) => {
        const typeName = tour.expand?.vehicle?.expand?.vehicle_type?.name || "Unknown";
        byVehicleType[typeName] = (byVehicleType[typeName] || 0) + 1;
      });

      const stats = {
        totalShifts: tours.length,
        thisMonth: thisMonthCount,
        avgPerMonth: tours.length / 12,
        byVehicleType: Object.entries(byVehicleType).map(([name, count]) => ({ name, count })),
      };

      const csv = generateStatsSummaryCSV(stats, selectedYear);
      downloadCSV(csv, `statistics-${profile?.last_name || "export"}-${selectedYear}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("filters")}
          </CardTitle>
          <CardDescription>{t("filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label>{t("year")}</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>{t("month")}</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            {t("shiftsFound", { count: tours.length })}
          </p>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t("exportShifts")}
            </CardTitle>
            <CardDescription>{t("exportShiftsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportShifts}
              disabled={isExporting || isLoading || tours.length === 0}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("downloadCSV")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t("exportStats")}
            </CardTitle>
            <CardDescription>{t("exportStatsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportStats}
              disabled={isExporting || isLoading || tours.length === 0}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("downloadCSV")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
