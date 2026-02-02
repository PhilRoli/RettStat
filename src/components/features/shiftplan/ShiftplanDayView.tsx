"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShiftplanByDate, useDeleteShiftplan, useDeleteTour } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TourDialog } from "./TourDialog";

interface ShiftplanDayViewProps {
  unitId: string;
  date: Date | null;
  onClose: () => void;
  isEditMode?: boolean;
}

export function ShiftplanDayView({
  unitId,
  date,
  onClose,
  isEditMode = false,
}: ShiftplanDayViewProps) {
  const t = useTranslations("shifts");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;
  const { toast } = useToast();
  const [tourDialogOpen, setTourDialogOpen] = useState(false);

  const { data: shiftplan, isLoading } = useShiftplanByDate({
    unitId,
    date: date || new Date(),
  });

  const deleteShiftplanMutation = useDeleteShiftplan();
  const deleteTourMutation = useDeleteTour();

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), "HH:mm", { locale: dateLocale });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP", { locale: dateLocale });
  };

  const getPersonName = (person: { first_name: string; last_name: string } | null | undefined) => {
    if (!person) return null;
    return `${person.first_name} ${person.last_name}`;
  };

  const handleDeleteShiftplan = async () => {
    if (!shiftplan || !window.confirm(t("confirmDelete"))) return;

    try {
      await deleteShiftplanMutation.mutateAsync(shiftplan.id);
      toast({ description: t("shiftplanDeleted") });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete shiftplan",
      });
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!window.confirm(t("confirmDeleteTour"))) return;

    try {
      await deleteTourMutation.mutateAsync(tourId);
      toast({ description: t("tourDeleted") });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tour",
      });
    }
  };

  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("viewShiftplan")}</DialogTitle>
          <DialogDescription>{date && formatDate(date.toISOString())}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !shiftplan ? (
          <p className="text-muted-foreground py-8 text-center">{t("noShiftplans")}</p>
        ) : (
          <div className="space-y-6">
            {/* Shiftplan Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{t("shiftLead")}</p>
                  <p className="font-medium">{getPersonName(shiftplan.shift_lead)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">{t("duration")}</p>
                    <p className="font-medium">
                      {formatTime(shiftplan.start_time)} - {formatTime(shiftplan.end_time)}
                    </p>
                  </div>
                  {isEditMode && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleDeleteShiftplan}
                      disabled={deleteShiftplanMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {shiftplan.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">{t("notes")}</p>
                  <p className="text-sm">{shiftplan.notes}</p>
                </div>
              )}
            </div>

            {/* Tours Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tourName")}</TableHead>
                    <TableHead>{t("vehicle")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("startTime")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("endTime")}</TableHead>
                    <TableHead>{t("driver")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("lead")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("student")}</TableHead>
                    {isEditMode && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftplan.tours.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isEditMode ? 8 : 7}
                        className="text-muted-foreground text-center"
                      >
                        {t("noShiftplans")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    shiftplan.tours.map((tour) => (
                      <TableRow key={tour.id}>
                        <TableCell className="font-medium">
                          {tour.name || tour.tour_type?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {tour.vehicle ? (
                            <Badge variant="outline">{tour.vehicle.call_sign}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatTime(tour.start_time)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatTime(tour.end_time)}
                        </TableCell>
                        <TableCell>
                          <div
                            className="max-w-32 truncate"
                            title={getPersonName(tour.driver) || undefined}
                          >
                            {getPersonName(tour.driver) || (
                              <span className="text-muted-foreground text-sm">{t("noDriver")}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div
                            className="max-w-32 truncate"
                            title={getPersonName(tour.lead) || undefined}
                          >
                            {getPersonName(tour.lead) || (
                              <span className="text-muted-foreground text-sm">{t("noLead")}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div
                            className="max-w-32 truncate"
                            title={getPersonName(tour.student) || undefined}
                          >
                            {getPersonName(tour.student) || (
                              <span className="text-muted-foreground text-sm">
                                {t("noStudent")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {isEditMode && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTour(tour.id)}
                              disabled={deleteTourMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add Tour Button */}
            {isEditMode && (
              <Button onClick={() => setTourDialogOpen(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t("addTour")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>

      {/* Tour Dialog */}
      {shiftplan && (
        <TourDialog
          key={tourDialogOpen ? "open" : "closed"}
          open={tourDialogOpen}
          onClose={() => setTourDialogOpen(false)}
          shiftplanId={shiftplan.id}
          unitId={unitId}
          defaultStartTime={shiftplan.start_time}
          defaultEndTime={shiftplan.end_time}
        />
      )}
    </Dialog>
  );
}
