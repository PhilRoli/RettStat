"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleCalendar, ShiftList, AbsenceRequestDialog } from "@/components/schedule";
import { useMyShifts, useMyAbsences, downloadICal } from "@/hooks/use-my-schedule";

export default function SchedulePage() {
  const t = useTranslations("schedule");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-AT" : "en-US";
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate date range for current month
  const { startDate, endDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      startDate: new Date(year, month, 1).toISOString().split("T")[0],
      endDate: new Date(year, month + 1, 0).toISOString().split("T")[0],
    };
  }, [currentDate]);

  const { data: tours, isLoading: toursLoading } = useMyShifts(startDate, endDate);
  const { data: absences, isLoading: absencesLoading } = useMyAbsences(currentDate.getFullYear());

  // Filter upcoming shifts (next 30 days)
  const upcomingShifts = useMemo(() => {
    if (!tours) return [];
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const endStr = thirtyDaysLater.toISOString().split("T")[0];

    return tours.filter((t) => {
      const date = t.expand?.shiftplan?.date;
      return date && date >= today && date <= endStr;
    });
  }, [tours]);

  // Shifts for selected date
  const selectedDateShifts = useMemo(() => {
    if (!selectedDate || !tours) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return tours.filter((t) => t.expand?.shiftplan?.date === dateStr);
  }, [selectedDate, tours]);

  const handleExport = () => {
    if (tours && tours.length > 0) {
      downloadICal(tours, `shifts-${startDate}-${endDate}.ics`);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <AbsenceRequestDialog />
          <Button variant="outline" onClick={handleExport} disabled={!tours || tours.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t("exportICal")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">{t("calendar")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("upcoming")}</TabsTrigger>
          <TabsTrigger value="absences">{t("absences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendar */}
            {toursLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <ScheduleCalendar
                tours={tours || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onDayClick={setSelectedDate}
              />
            )}

            {/* Selected day details */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="mb-4 font-semibold">
                {selectedDate
                  ? selectedDate.toLocaleDateString(dateLocale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : t("selectDay")}
              </h3>
              {selectedDate ? (
                <ShiftList tours={selectedDateShifts} emptyMessage={t("noShiftsOnDay")} compact />
              ) : (
                <p className="text-muted-foreground text-sm">{t("clickDayToSee")}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          {toursLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <ShiftList
              tours={upcomingShifts}
              title={t("next30Days")}
              emptyMessage={t("noUpcomingShifts")}
            />
          )}
        </TabsContent>

        <TabsContent value="absences" className="mt-4">
          {absencesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : absences && absences.length > 0 ? (
            <div className="space-y-3">
              {absences.map((absence) => (
                <div key={absence.id} className="bg-card rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {absence.expand?.category && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: absence.expand.category.color }}
                        />
                      )}
                      <span className="font-medium">{absence.expand?.category?.name}</span>
                    </div>
                    <span
                      className={`text-sm ${
                        absence.status === "approved"
                          ? "text-green-600"
                          : absence.status === "rejected"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {t(`absenceStatus.${absence.status}`)}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-2 text-sm">
                    {new Date(absence.start_date).toLocaleDateString()} -{" "}
                    {new Date(absence.end_date).toLocaleDateString()}
                  </div>
                  {absence.reason && (
                    <p className="text-muted-foreground mt-2 text-sm">{absence.reason}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-20 items-center justify-center rounded-lg border border-dashed text-sm">
              {t("noAbsences")}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
