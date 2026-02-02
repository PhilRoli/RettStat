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
import { useCreateShiftplan, useUnitMembers } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

interface ShiftplanDialogProps {
  open: boolean;
  onClose: () => void;
  unitId: string;
  selectedDate?: Date;
}

export function ShiftplanDialog({ open, onClose, unitId, selectedDate }: ShiftplanDialogProps) {
  const t = useTranslations("shifts");
  const { toast } = useToast();

  // Format the selected date for the input (YYYY-MM-DD)
  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";

  const [date, setDate] = useState(dateStr);
  const [shiftLeadId, setShiftLeadId] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("19:00");
  const [notes, setNotes] = useState("");

  const { data: members, isLoading: isLoadingMembers } = useUnitMembers(unitId);
  const createShiftplanMutation = useCreateShiftplan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !shiftLeadId || !startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Combine date and time
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    // Validate times
    if (endDateTime <= startDateTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "End time must be after start time",
      });
      return;
    }

    try {
      await createShiftplanMutation.mutateAsync({
        unit_id: unitId,
        shift_lead_id: shiftLeadId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: notes || null,
      });

      toast({ description: t("shiftplanCreated") });
      onClose();

      // Reset form
      setDate(dateStr);
      setShiftLeadId("");
      setStartTime("07:00");
      setEndTime("19:00");
      setNotes("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create shiftplan",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("createShiftplan")}</DialogTitle>
            <DialogDescription>Create a new shift plan for your unit</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Shift Lead */}
            <div className="space-y-2">
              <Label htmlFor="shiftLead">{t("shiftLead")}</Label>
              <Select value={shiftLeadId} onValueChange={setShiftLeadId} required>
                <SelectTrigger id="shiftLead">
                  <SelectValue placeholder={t("selectShiftLead")} />
                </SelectTrigger>
                <SelectContent>
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

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("startTime")}</Label>
              <Input
                id="startTime"
                type="time"
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
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createShiftplanMutation.isPending}>
              {t("createShiftplan")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
