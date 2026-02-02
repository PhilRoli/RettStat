"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRegistration, useDeleteRegistration } from "@/hooks/use-events";
import { useUnitMembers } from "@/hooks/use-unit-members";
import type { EventPositionWithExpand } from "@/hooks/use-events";

interface PositionListProps {
  positions: EventPositionWithExpand[];
  eventId: string;
  unitId: string;
  canEdit?: boolean;
}

export function PositionList({ positions, eventId, unitId, canEdit = false }: PositionListProps) {
  const t = useTranslations("events");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const { data: members } = useUnitMembers(unitId);
  const createRegistration = useCreateRegistration();
  const deleteRegistration = useDeleteRegistration();

  const handleAssignUser = async () => {
    if (!selectedPosition || !selectedUser) return;

    await createRegistration.mutateAsync({
      event: eventId,
      position: selectedPosition,
      user: selectedUser,
    });

    setAssignDialogOpen(false);
    setSelectedPosition(null);
    setSelectedUser("");
  };

  const handleRemoveUser = async (registrationId: string) => {
    await deleteRegistration.mutateAsync({ id: registrationId, eventId });
  };

  if (positions.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center rounded-lg border border-dashed">
        {t("noPositions")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => {
        const registeredCount = position.registrations?.length || 0;
        const maxCount = position.max_count || position.min_count;
        const isFull = maxCount && registeredCount >= maxCount;

        return (
          <div key={position.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{position.name}</h4>
                {position.description && (
                  <p className="text-muted-foreground text-sm">{position.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={isFull ? "default" : "secondary"}>
                    {registeredCount}/{maxCount || "∞"}
                  </Badge>
                  {position.expand?.required_qualifications?.map((qual) => (
                    <Badge key={qual.id} variant="outline" className="text-xs">
                      {qual.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {canEdit && !isFull && (
                <Dialog
                  open={assignDialogOpen && selectedPosition === position.id}
                  onOpenChange={(open) => {
                    setAssignDialogOpen(open);
                    if (open) setSelectedPosition(position.id);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-1 h-4 w-4" />
                      {t("assignUser")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t("assignUserToPosition", { position: position.name })}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectUser")} />
                        </SelectTrigger>
                        <SelectContent>
                          {members?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.first_name} {member.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignUser}
                        disabled={!selectedUser || createRegistration.isPending}
                        className="w-full"
                      >
                        {t("assign")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Registered users */}
            {position.registrations && position.registrations.length > 0 && (
              <div className="mt-3 space-y-2">
                {position.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <User className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">
                        {reg.expand?.user?.first_name} {reg.expand?.user?.last_name}
                      </span>
                    </div>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleRemoveUser(reg.id)}
                        disabled={deleteRegistration.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
