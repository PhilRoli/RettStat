"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { pb } from "@/lib/pocketbase";
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
import type {
  AssignmentRecord,
  AssignmentCategoryRecord,
  PermissionRecord,
  AssignmentDefaultPermissionRecord,
} from "@/lib/pocketbase/types";

interface AssignmentWithExpand extends AssignmentRecord {
  expand?: {
    category?: AssignmentCategoryRecord;
  };
}

interface CategoryPermission {
  category_id: string;
  permission_id: string;
}

export function AssignmentsManagement() {
  const t = useTranslations("admin.assignments");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<AssignmentWithExpand[]>([]);
  const [categories, setCategories] = useState<AssignmentCategoryRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [categoryPermissions, setCategoryPermissions] = useState<CategoryPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithExpand | null>(null);
  const [selectedCat, setSelectedCat] = useState<AssignmentCategoryRecord | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "assign" | "cat"; id: string } | null>(null);

  const [assignFormData, setAssignFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    max_participants: "",
  });

  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    sort_order: 0,
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [assignRes, catsRes, permsRes, catPermsRes] = await Promise.all([
        pb.collection("assignments").getFullList<AssignmentWithExpand>({
          sort: "title",
          expand: "category",
        }),
        pb.collection("assignment_categories").getFullList<AssignmentCategoryRecord>({
          sort: "sort_order,name",
        }),
        pb.collection("permissions").getFullList<PermissionRecord>({
          sort: "name",
        }),
        pb
          .collection("assignment_default_permissions")
          .getFullList<AssignmentDefaultPermissionRecord>(),
      ]);

      setAssignments(assignRes);
      setCategories(catsRes);
      setPermissions(permsRes);
      setCategoryPermissions(
        catPermsRes.map((cp) => ({
          category_id: cp.assignment_category,
          permission_id: cp.permission,
        }))
      );
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
      title: "",
      category: "",
      description: "",
      location: "",
      start_date: "",
      end_date: "",
      max_participants: "",
    });
    setAssignDialogOpen(true);
  };

  const handleAssignEdit = (assign: AssignmentWithExpand) => {
    setSelectedAssignment(assign);
    setAssignFormData({
      title: assign.title,
      category: assign.category || "",
      description: assign.description || "",
      location: assign.location || "",
      start_date: assign.start_date || "",
      end_date: assign.end_date || "",
      max_participants: assign.max_participants?.toString() || "",
    });
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const assignData = {
        title: assignFormData.title,
        category: assignFormData.category || undefined,
        description: assignFormData.description || undefined,
        location: assignFormData.location || undefined,
        start_date: assignFormData.start_date || undefined,
        end_date: assignFormData.end_date || undefined,
        max_participants: assignFormData.max_participants
          ? parseInt(assignFormData.max_participants)
          : undefined,
      };

      if (selectedAssignment) {
        await pb.collection("assignments").update(selectedAssignment.id, assignData);

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        await pb.collection("assignments").create(assignData);

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
      color: "#3b82f6",
      sort_order: categories.length,
    });
    setCatDialogOpen(true);
  };

  const handleCatEdit = (cat: AssignmentCategoryRecord) => {
    setSelectedCat(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || "",
      color: cat.color || "#3b82f6",
      sort_order: cat.sort_order,
    });
    setCatDialogOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const catData = {
        name: catFormData.name,
        description: catFormData.description || undefined,
        color: catFormData.color,
        sort_order: catFormData.sort_order,
      };

      if (selectedCat) {
        await pb.collection("assignment_categories").update(selectedCat.id, catData);

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        await pb.collection("assignment_categories").create(catData);

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

  const handlePermissionsClick = (cat: AssignmentCategoryRecord) => {
    setSelectedCat(cat);
    const currentPerms = categoryPermissions
      .filter((cp) => cp.category_id === cat.id)
      .map((cp) => cp.permission_id);
    setSelectedPermissions(currentPerms);
    setPermDialogOpen(true);
  };

  const handlePermissionsSubmit = async () => {
    if (!selectedCat) return;

    setSaving(true);

    try {
      // Fetch existing permissions for this category
      const existingPerms = await pb
        .collection("assignment_default_permissions")
        .getFullList<AssignmentDefaultPermissionRecord>({
          filter: `assignment_category = "${selectedCat.id}"`,
        });

      const existingPermIds = new Set(existingPerms.map((p) => p.permission));
      const newPermIds = new Set(selectedPermissions);

      // Calculate differences
      const toDelete = existingPerms.filter((p) => !newPermIds.has(p.permission));
      const toAdd = selectedPermissions.filter((id) => !existingPermIds.has(id));

      // Delete removed permissions
      for (const perm of toDelete) {
        await pb.collection("assignment_default_permissions").delete(perm.id);
      }

      // Insert new permissions
      for (const permId of toAdd) {
        await pb.collection("assignment_default_permissions").create({
          assignment_category: selectedCat.id,
          permission: permId,
        });
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
      if (deleteItem.type === "assign") {
        await pb.collection("assignments").delete(deleteItem.id);
      } else {
        await pb.collection("assignment_categories").delete(deleteItem.id);
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
                          <div className="flex items-center gap-2">{assign.title}</div>
                        </TableCell>
                        <TableCell>{assign.expand?.category?.name || t("noCategory")}</TableCell>
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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </TableCell>
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
                              onClick={() => handlePermissionsClick(cat)}
                              title={t("permissionsButton")}
                            >
                              <UserCog className="h-4 w-4" />
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
              {categories.map((cat) => {
                const catPerms = categoryPermissions
                  .filter((cp) => cp.category_id === cat.id)
                  .map((cp) => cp.permission_id);

                return (
                  <div key={cat.id} className="rounded-md border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <h4 className="font-medium">{cat.name}</h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermissionsClick(cat)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("editPermissions")}
                      </Button>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {catPerms.length === 0
                        ? t("noPermissions")
                        : permissions
                            .filter((p) => catPerms.includes(p.id))
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment ? t("editAssignmentTitle") : t("createAssignmentTitle")}
            </DialogTitle>
            <DialogDescription>{t("assignmentDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assign-title">{t("titleLabel")}</Label>
                <Input
                  id="assign-title"
                  value={assignFormData.title}
                  onChange={(e) => setAssignFormData({ ...assignFormData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-cat">{t("categoryLabel")}</Label>
                <Select
                  value={assignFormData.category}
                  onValueChange={(value) =>
                    setAssignFormData({ ...assignFormData, category: value })
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assign-start">{t("startDateLabel")}</Label>
                  <Input
                    id="assign-start"
                    type="datetime-local"
                    value={assignFormData.start_date}
                    onChange={(e) =>
                      setAssignFormData({ ...assignFormData, start_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assign-end">{t("endDateLabel")}</Label>
                  <Input
                    id="assign-end"
                    type="datetime-local"
                    value={assignFormData.end_date}
                    onChange={(e) =>
                      setAssignFormData({ ...assignFormData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-location">{t("locationLabel")}</Label>
                <Input
                  id="assign-location"
                  value={assignFormData.location}
                  onChange={(e) =>
                    setAssignFormData({ ...assignFormData, location: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assign-max">{t("maxParticipantsLabel")}</Label>
                <Input
                  id="assign-max"
                  type="number"
                  min="1"
                  value={assignFormData.max_participants}
                  onChange={(e) =>
                    setAssignFormData({ ...assignFormData, max_participants: e.target.value })
                  }
                />
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
        <DialogContent className="sm:max-w-md">
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
                <Label htmlFor="cat-color">{t("colorLabel")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cat-color"
                    type="color"
                    value={catFormData.color}
                    onChange={(e) => setCatFormData({ ...catFormData, color: e.target.value })}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <Input
                    value={catFormData.color}
                    onChange={(e) => setCatFormData({ ...catFormData, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-order">{t("sortOrderLabel")}</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={catFormData.sort_order}
                  onChange={(e) =>
                    setCatFormData({ ...catFormData, sort_order: parseInt(e.target.value) || 0 })
                  }
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editPermissionsTitle")}</DialogTitle>
            <DialogDescription>
              {t("editPermissionsDescription", { category: selectedCat?.name || "" })}
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
        <DialogContent className="sm:max-w-md">
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
