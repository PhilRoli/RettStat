"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Edit, Eye, Plus } from "lucide-react";
import { useUserUnits, useShiftplanDates, useHasPermission } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftplanDayView, ShiftplanDialog } from "@/components/features/shiftplan";
export default function ShiftplanPage() {
  const t = useTranslations("shifts");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogDate, setCreateDialogDate] = useState<Date | undefined>();

  const { data: units, isLoading: isLoadingUnits } = useUserUnits();
  const { hasPermission: canEdit } = useHasPermission("edit_shiftplans", selectedUnit);

  // Initialize selectedUnit when units load
  if (!selectedUnit && units && units.length > 0) {
    setSelectedUnit(units[0].id);
  }

  const { data: shiftplanDates, isLoading: isLoadingShiftplans } = useShiftplanDates({
    unitId: selectedUnit,
    month: selectedMonth,
    year: selectedYear,
  });

  const months = [
    t("month.january"),
    t("month.february"),
    t("month.march"),
    t("month.april"),
    t("month.may"),
    t("month.june"),
    t("month.july"),
    t("month.august"),
    t("month.september"),
    t("month.october"),
    t("month.november"),
    t("month.december"),
  ];

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Generate calendar grid
  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        {canEdit && (
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {t("viewMode")}
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                {t("editMode")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{t("selectMonth")}</CardTitle>
          <CardDescription>{t("selectUnit")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unit Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("selectUnit")}</label>
            {isLoadingUnits ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Month/Year Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("selectMonth")}</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-medium">
                {months[selectedMonth]} {selectedYear}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {months[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingShiftplans ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Calendar header - days of week */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const hasShiftplan = day && shiftplanDates.includes(day);

                  return (
                    <button
                      key={index}
                      disabled={!day}
                      onClick={() => {
                        if (day) {
                          if (hasShiftplan) {
                            setSelectedDate(new Date(selectedYear, selectedMonth, day));
                          } else if (isEditMode && canEdit) {
                            // Open create dialog for empty date in edit mode
                            setCreateDialogDate(new Date(selectedYear, selectedMonth, day));
                            setCreateDialogOpen(true);
                          }
                        }
                      }}
                      className={`aspect-square rounded-md p-2 text-sm transition-colors ${!day ? "invisible" : ""} ${
                        hasShiftplan
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : isEditMode && canEdit
                            ? "border-muted-foreground/30 hover:border-primary hover:bg-accent border-2 border-dashed"
                            : "text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {day}
                      {!hasShiftplan && isEditMode && canEdit && day && (
                        <Plus className="mx-auto mt-1 h-3 w-3 opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>

              {shiftplanDates.length === 0 && (
                <p className="text-muted-foreground mt-4 text-center text-sm">
                  {t("noShiftplans")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day View Dialog */}
      <ShiftplanDayView
        unitId={selectedUnit}
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        isEditMode={isEditMode && canEdit}
      />

      {/* Create Shiftplan Dialog */}
      <ShiftplanDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setCreateDialogDate(undefined);
        }}
        unitId={selectedUnit}
        selectedDate={createDialogDate}
      />
    </div>
  );
}
