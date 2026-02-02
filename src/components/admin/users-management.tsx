"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { pb } from "@/lib/pocketbase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, User, Edit, Shield, Award, UserCog } from "lucide-react";
import type {
  ProfileRecord,
  UserRecord,
  UserAssignmentRecord,
  UnitRecord,
} from "@/lib/pocketbase/types";

interface ProfileWithExpand extends ProfileRecord {
  expand?: {
    user?: UserRecord;
  };
}

interface UserAssignmentWithExpand extends UserAssignmentRecord {
  expand?: {
    unit?: UnitRecord;
  };
}

interface UserWithUnits extends ProfileWithExpand {
  user_assignments?: UserAssignmentWithExpand[];
}

export function UsersManagement() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithUnits[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithUnits | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [qualificationsDialogOpen, setQualificationsDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    serviceId: "",
  });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.first_name?.toLowerCase().includes(query) ||
            user.last_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.service_id?.toLowerCase().includes(query) ||
            user.phone?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch profiles with expanded user data
      const profiles = await pb.collection("profiles").getFullList<ProfileWithExpand>({
        sort: "-created",
        expand: "user",
      });

      // Fetch user assignments with expanded unit data for all profiles
      const userIds = profiles.map((p) => p.user).filter(Boolean);
      const userAssignmentsMap: Map<string, UserAssignmentWithExpand[]> = new Map();

      if (userIds.length > 0) {
        const userAssignments = await pb
          .collection("user_assignments")
          .getFullList<UserAssignmentWithExpand>({
            filter: userIds.map((id) => `user="${id}"`).join(" || "),
            expand: "unit",
          });

        // Group assignments by user ID
        for (const assignment of userAssignments) {
          const existing = userAssignmentsMap.get(assignment.user) || [];
          existing.push(assignment);
          userAssignmentsMap.set(assignment.user, existing);
        }
      }

      // Combine profiles with their assignments
      const usersWithUnits: UserWithUnits[] = profiles.map((profile) => ({
        ...profile,
        email: profile.expand?.user?.email || "",
        user_assignments: userAssignmentsMap.get(profile.user) || [],
      }));

      setUsers(usersWithUnits);
      setFilteredUsers(usersWithUnits);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: t("fetchErrorTitle"),
        description: t("fetchErrorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: UserWithUnits) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      serviceId: user.service_id || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);

    try {
      await pb.collection("profiles").update(selectedUser.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        service_id: formData.serviceId,
      });

      // Update email if changed (this requires admin API in production)
      if (formData.email !== selectedUser.email) {
        // Note: In production, this would require admin API call
        // For now, we'll skip email updates or handle via admin SDK
        toast({
          title: t("emailChangeNotice"),
          description: t("emailChangeNoticeDescription"),
        });
      }

      toast({
        title: t("updateSuccessTitle"),
        description: t("updateSuccessDescription"),
      });

      setEditDialogOpen(false);
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: t("updateErrorTitle"),
        description: t("updateErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionsClick = (user: UserWithUnits) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const handleQualificationsClick = (user: UserWithUnits) => {
    setSelectedUser(user);
    setQualificationsDialogOpen(true);
  };

  const handleAssignmentsClick = (user: UserWithUnits) => {
    setSelectedUser(user);
    setAssignmentsDialogOpen(true);
  };

  const getUserUnits = (user: UserWithUnits) => {
    if (!user.user_assignments || user.user_assignments.length === 0) {
      return t("noUnits");
    }
    return user.user_assignments
      .map((ua) => ua.expand?.unit?.name || "")
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{t("nameColumn")}</TableHead>
                <TableHead>{t("emailColumn")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("phoneColumn")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("serviceIdColumn")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("unitsColumn")}</TableHead>
                <TableHead className="text-right">{t("actionsColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {searchQuery ? t("noResults") : t("noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar ? pb.files.getURL(user, user.avatar) : undefined}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.email}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user.service_id || "-"}</TableCell>
                    <TableCell className="hidden xl:table-cell">{getUserUnits(user)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          title={t("editButton")}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">{t("editButton")}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermissionsClick(user)}
                          title={t("permissionsButton")}
                          className="hidden md:inline-flex"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQualificationsClick(user)}
                          title={t("qualificationsButton")}
                          className="hidden lg:inline-flex"
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignmentsClick(user)}
                          title={t("assignmentsButton")}
                          className="hidden xl:inline-flex"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editDialogTitle")}</DialogTitle>
            <DialogDescription>{t("editDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                />
                <p className="text-muted-foreground text-xs">{t("emailHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t("phoneLabel")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+43 123 456789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceId">{t("serviceIdLabel")}</Label>
                <Input
                  id="serviceId"
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog (Placeholder) */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("permissionsDialogTitle")}</DialogTitle>
            <DialogDescription>{t("permissionsDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">{t("permissionsPlaceholder")}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setPermissionsDialogOpen(false)}>{tCommon("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Qualifications Dialog (Placeholder) */}
      <Dialog open={qualificationsDialogOpen} onOpenChange={setQualificationsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("qualificationsDialogTitle")}</DialogTitle>
            <DialogDescription>{t("qualificationsDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">{t("qualificationsPlaceholder")}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setQualificationsDialogOpen(false)}>{tCommon("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignments Dialog (Placeholder) */}
      <Dialog open={assignmentsDialogOpen} onOpenChange={setAssignmentsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("assignmentsDialogTitle")}</DialogTitle>
            <DialogDescription>{t("assignmentsDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">{t("assignmentsPlaceholder")}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setAssignmentsDialogOpen(false)}>{tCommon("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
