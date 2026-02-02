"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Edit, Trash2, UserCog } from "lucide-react";
import type { Database } from "@/types/database";
import type { AssignmentType } from "@/types/database";

type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];
type AssignmentCategory = Database["public"]["Tables"]["assignment_categories"]["Row"];
type AssignmentCategoryInsert = Database["public"]["Tables"]["assignment_categories"]["Insert"];
type Permission = Database["public"]["Tables"]["permissions"]["Row"];

interface AssignmentWithCategory extends Assignment {
  assignment_categories?: AssignmentCategory | null;
}

interface AssignmentPermission {
  assignment_id: string;
  permission_id: string;
}

export function AssignmentsManagement() {
  const t = useTranslations("admin.assignments");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<AssignmentWithCategory[]>([]);
  const [categories, setCategories] = useState<AssignmentCategory[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignmentPermissions, setAssignmentPermissions] = useState<AssignmentPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithCategory | null>(null);
  const [selectedCat, setSelectedCat] = useState<AssignmentCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "assign" | "cat"; id: string } | null>(null);

  const [assignFormData, setAssignFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    icon: "",
    type: "station" as AssignmentType,
  });

  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [assignRes, catsRes, permsRes, assignPermsRes] = await Promise.all([
        supabase
          .from("assignments")
          .select("*, assignment_categories(*)")
          .order("name", { ascending: true }),
        supabase.from("assignment_categories").select("*").order("name", { ascending: true }),
        supabase.from("permissions").select("*").order("name", { ascending: true }),
        supabase.from("assignment_default_permissions").select("assignment_id, permission_id"),
      ]);

      if (assignRes.error) throw assignRes.error;
      if (catsRes.error) throw catsRes.error;
      if (permsRes.error) throw permsRes.error;
      if (assignPermsRes.error) throw assignPermsRes.error;

      setAssignments((assignRes.data as AssignmentWithCategory[]) || []);
      setCategories(catsRes.data || []);
      setPermissions(permsRes.data || []);
      setAssignmentPermissions(assignPermsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: t("fetchErrorTitle"),
        description: t("fetchErrorDescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCreate = () => {
    setSelectedAssignment(null);
    setAssignFormData({
      name: "",
      category_id: "",
      description: "",
      icon: "",
      type: "station",
    });
    setAssignDialogOpen(true);
  };

  const handleAssignEdit = (assign: AssignmentWithCategory) => {
    setSelectedAssignment(assign);
    setAssignFormData({
      name: assign.name,
      category_id: assign.category_id || "",
      description: assign.description || "",
      icon: assign.icon || "",
      type: assign.type,
    });
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const assignData: AssignmentInsert = {
        name: assignFormData.name,
        category_id: assignFormData.category_id || null,
        description: assignFormData.description || null,
        icon: assignFormData.icon || null,
        type: assignFormData.type,
      };

      if (selectedAssignment) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("assignments")
          .update(assignData)
          .eq("id", selectedAssignment.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("assignments").insert(assignData);

        if (error) throw error;

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setAssignDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving assignment:", error);
      toast({
        variant: "destructive",
        title: t("saveErrorTitle"),
        description: t("saveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCatCreate = () => {
    setSelectedCat(null);
    setCatFormData({
      name: "",
      description: "",
      icon: "",
    });
    setCatDialogOpen(true);
  };

  const handleCatEdit = (cat: AssignmentCategory) => {
    setSelectedCat(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "",
    });
    setCatDialogOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const catData: AssignmentCategoryInsert = {
        name: catFormData.name,
        description: catFormData.description || null,
        icon: catFormData.icon || null,
      };

      if (selectedCat) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("assignment_categories")
          .update(catData)
          .eq("id", selectedCat.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("assignment_categories").insert(catData);

        if (error) throw error;

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setCatDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        variant: "destructive",
        title: t("saveErrorTitle"),
        description: t("saveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionsClick = (assign: AssignmentWithCategory) => {
    setSelectedAssignment(assign);
    const currentPerms = assignmentPermissions
      .filter((ap) => ap.assignment_id === assign.id)
      .map((ap) => ap.permission_id);
    setSelectedPermissions(currentPerms);
    setPermDialogOpen(true);
  };

  const handlePermissionsSubmit = async () => {
    if (!selectedAssignment) return;

    setSaving(true);

    try {
      const supabase = createClient();

      // Delete existing permissions
      await supabase
        .from("assignment_default_permissions")
        .delete()
        .eq("assignment_id", selectedAssignment.id);

      // Insert new permissions
      if (selectedPermissions.length > 0) {
        const newPerms = selectedPermissions.map((perm_id) => ({
          assignment_id: selectedAssignment.id,
          permission_id: perm_id,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("assignment_default_permissions")
          .insert(newPerms);

        if (error) throw error;
      }

      toast({
        title: t("permissionsSuccessTitle"),
        description: t("permissionsSuccessDescription"),
      });

      setPermDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        variant: "destructive",
        title: t("saveErrorTitle"),
        description: t("saveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (type: "assign" | "cat", id: string) => {
    setDeleteItem({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    setSaving(true);

    try {
      const supabase = createClient();

      if (deleteItem.type === "assign") {
        const { error } = await supabase.from("assignments").delete().eq("id", deleteItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("assignment_categories")
          .delete()
          .eq("id", deleteItem.id);

        if (error) throw error;
      }

      toast({
        title: t("deleteSuccessTitle"),
        description: t("deleteSuccessDescription"),
      });

      setDeleteDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        variant: "destructive",
        title: t("deleteErrorTitle"),
        description: t("deleteErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">{t("assignmentsTab")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categoriesTab")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("permissionsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between">
            <div />
            <Button onClick={handleAssignCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createAssignment")}
            </Button>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nameColumn")}</TableHead>
                    <TableHead>{t("categoryColumn")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("descriptionColumn")}</TableHead>
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {t("noAssignments")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assign) => (
                      <TableRow key={assign.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {assign.icon && <UserCog className="h-4 w-4" />}
                            {assign.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assign.assignment_categories?.name || t("noCategory")}
                        </TableCell>
                        <TableCell className="hidden max-w-md truncate lg:table-cell">
                          {assign.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignEdit(assign)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePermissionsClick(assign)}
                              title={t("permissionsButton")}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick("assign", assign.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between">
            <div />
            <Button onClick={handleCatCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createCategory")}
            </Button>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nameColumn")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("descriptionColumn")}</TableHead>
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {t("noCategories")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="hidden max-w-md truncate md:table-cell">
                          {cat.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleCatEdit(cat)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick("cat", cat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="rounded-md border p-6">
            <h3 className="mb-4 text-lg font-medium">{t("defaultPermissionsTitle")}</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {t("defaultPermissionsDescription")}
            </p>

            <div className="space-y-4">
              {assignments.map((assign) => {
                const assignPerms = assignmentPermissions
                  .filter((ap) => ap.assignment_id === assign.id)
                  .map((ap) => ap.permission_id);

                return (
                  <div key={assign.id} className="rounded-md border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{assign.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermissionsClick(assign)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("editPermissions")}
                      </Button>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {assignPerms.length === 0
                        ? t("noPermissions")
                        : permissions
                            .filter((p) => assignPerms.includes(p.id))
                            .map((p) => p.name)
                            .join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment ? t("editAssignmentTitle") : t("createAssignmentTitle")}
            </DialogTitle>
            <DialogDescription>{t("assignmentDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assign-name">{t("nameLabel")}</Label>
                <Input
                  id="assign-name"
                  value={assignFormData.name}
                  onChange={(e) => setAssignFormData({ ...assignFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-cat">{t("categoryLabel")}</Label>
                <Select
                  value={assignFormData.category_id}
                  onValueChange={(value) =>
                    setAssignFormData({ ...assignFormData, category_id: value })
                  }
                >
                  <SelectTrigger id="assign-cat">
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-type">{t("typeLabel")}</Label>
                <Select
                  value={assignFormData.type}
                  onValueChange={(value) =>
                    setAssignFormData({ ...assignFormData, type: value as AssignmentType })
                  }
                >
                  <SelectTrigger id="assign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="station">{t("typeStation")}</SelectItem>
                    <SelectItem value="vehicle">{t("typeVehicle")}</SelectItem>
                    <SelectItem value="team">{t("typeTeam")}</SelectItem>
                    <SelectItem value="other">{t("typeOther")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-desc">{t("descriptionLabel")}</Label>
                <Textarea
                  id="assign-desc"
                  value={assignFormData.description}
                  onChange={(e) =>
                    setAssignFormData({ ...assignFormData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-icon">{t("iconLabel")}</Label>
                <Input
                  id="assign-icon"
                  value={assignFormData.icon}
                  onChange={(e) => setAssignFormData({ ...assignFormData, icon: e.target.value })}
                  placeholder="user-cog"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
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

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCat ? t("editCategoryTitle") : t("createCategoryTitle")}
            </DialogTitle>
            <DialogDescription>{t("categoryDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCatSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cat-name">{t("nameLabel")}</Label>
                <Input
                  id="cat-name"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-desc">{t("descriptionLabel")}</Label>
                <Textarea
                  id="cat-desc"
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-icon">{t("iconLabel")}</Label>
                <Input
                  id="cat-icon"
                  value={catFormData.icon}
                  onChange={(e) => setCatFormData({ ...catFormData, icon: e.target.value })}
                  placeholder="folder"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>
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

      {/* Permissions Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t("editPermissionsTitle")}</DialogTitle>
            <DialogDescription>
              {t("editPermissionsDescription", { assignment: selectedAssignment?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto py-4">
            {permissions.map((perm) => (
              <div key={perm.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`perm-${perm.id}`}
                  checked={selectedPermissions.includes(perm.id)}
                  onCheckedChange={() => togglePermission(perm.id)}
                />
                <Label
                  htmlFor={`perm-${perm.id}`}
                  className="flex-1 cursor-pointer text-sm font-normal"
                >
                  <div className="font-medium">{perm.name}</div>
                  {perm.description && (
                    <div className="text-muted-foreground text-xs">{perm.description}</div>
                  )}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPermDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="button" onClick={handlePermissionsSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>{t("deleteDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
