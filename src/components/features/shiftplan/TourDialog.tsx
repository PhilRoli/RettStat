"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTour, useUpdateTour, useUnitVehicles, useUnitMembers } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/types/supabase";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourDialogProps {
  open: boolean;
  onClose: () => void;
  shiftplanId: string;
  unitId: string;
  tour?: Tour;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export function TourDialog({
  open,
  onClose,
  shiftplanId,
  unitId,
  tour,
  defaultStartTime,
  defaultEndTime,
}: TourDialogProps) {
  const t = useTranslations("shifts");
  const { toast } = useToast();
  const [name, setName] = useState(tour?.name || "");
  const [vehicleId, setVehicleId] = useState(tour?.vehicle_id || "");
  const [startTime, setStartTime] = useState(
    tour?.start_time ? new Date(tour.start_time).toISOString().slice(0, 16) : defaultStartTime || ""
  );
  const [endTime, setEndTime] = useState(
    tour?.end_time ? new Date(tour.end_time).toISOString().slice(0, 16) : defaultEndTime || ""
  );
  const [driverId, setDriverId] = useState(tour?.driver_id || "");
  const [leadId, setLeadId] = useState(tour?.lead_id || "");
  const [studentId, setStudentId] = useState(tour?.student_id || "");
  const [notes, setNotes] = useState(tour?.notes || "");

  const { data: vehicles, isLoading: isLoadingVehicles } = useUnitVehicles(unitId);
  const { data: members, isLoading: isLoadingMembers } = useUnitMembers(unitId);

  const createTourMutation = useCreateTour();
  const updateTourMutation = useUpdateTour();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start and end times are required",
      });
      return;
    }

    const tourData = {
      shiftplan_id: shiftplanId,
      name: name || null,
      vehicle_id: vehicleId || null,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      driver_id: driverId || null,
      lead_id: leadId || null,
      student_id: studentId || null,
      notes: notes || null,
    };

    try {
      if (tour) {
        await updateTourMutation.mutateAsync({ id: tour.id, ...tourData });
        toast({ description: t("tourUpdated") });
      } else {
        await createTourMutation.mutateAsync(tourData);
        toast({ description: t("tourCreated") });
      }
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tour",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{tour ? t("editShift") : t("addTour")}</DialogTitle>
            <DialogDescription>
              {tour ? "Edit tour details" : "Add a new tour to this shift plan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tour Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("tourName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., RTW 1"
              />
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">{t("vehicle")}</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder={t("selectVehicle")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {isLoadingVehicles ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.call_sign}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("startTime")}</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">{t("endTime")}</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            {/* Driver */}
            <div className="space-y-2">
              <Label htmlFor="driver">{t("driver")}</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder={t("selectDriver")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {isLoadingMembers ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    members?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Lead */}
            <div className="space-y-2">
              <Label htmlFor="lead">{t("lead")}</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger id="lead">
                  <SelectValue placeholder={t("selectLead")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {isLoadingMembers ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    members?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Student */}
            <div className="space-y-2">
              <Label htmlFor="student">{t("student")}</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder={t("selectStudent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {isLoadingMembers ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    members?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTourMutation.isPending || updateTourMutation.isPending}
            >
              {tour ? t("saveChanges") : t("addTour")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
