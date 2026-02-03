"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getPb } from "@/lib/pocketbase";
import type { AbsenceCategoryRecord } from "@/lib/pocketbase/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";

export function AbsencesManagement() {
  const t = useTranslations("admin.absences");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [categories, setCategories] = useState<AbsenceCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedCat, setSelectedCat] = useState<AbsenceCategoryRecord | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string } | null>(null);

  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
    color: "#6b7280",
    requires_approval: false,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const pb = getPb();
      const catsData = await pb
        .collection("absence_categories")
        .getFullList<AbsenceCategoryRecord>({ sort: "name" });

      setCategories(catsData);
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

  const handleCatCreate = () => {
    setSelectedCat(null);
    setCatFormData({
      name: "",
      description: "",
      color: "#6b7280",
      requires_approval: false,
    });
    setCatDialogOpen(true);
  };

  const handleCatEdit = (cat: AbsenceCategoryRecord) => {
    setSelectedCat(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || "",
      color: cat.color || "#6b7280",
      requires_approval: cat.requires_approval,
    });
    setCatDialogOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const pb = getPb();
      const catData = {
        name: catFormData.name,
        description: catFormData.description || null,
        color: catFormData.color,
        requires_approval: catFormData.requires_approval,
      };

      if (selectedCat) {
        await pb.collection("absence_categories").update(selectedCat.id, catData);

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        await pb.collection("absence_categories").create(catData);

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setCatDialogOpen(false);
      fetchData();
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

  const handleDelete = (id: string) => {
    setDeleteItem({ id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    setSaving(true);
    try {
      const pb = getPb();
      await pb.collection("absence_categories").delete(deleteItem.id);

      toast({
        title: t("deleteSuccessTitle"),
        description: t("deleteSuccessDescription"),
      });

      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: "destructive",
        title: t("deleteErrorTitle"),
        description: t("deleteErrorDescription"),
      });
    } finally {
      setSaving(false);
      setDeleteItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCatCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createCategory")}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("nameColumn")}</TableHead>
                <TableHead>{t("colorColumn")}</TableHead>
                <TableHead>{t("requiresApprovalColumn")}</TableHead>
                <TableHead>{t("descriptionColumn")}</TableHead>
                <TableHead className="w-25">{t("actionsColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    {t("noCategories")}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-muted-foreground text-sm">{category.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.requires_approval ? tCommon("yes") : tCommon("no")}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCatEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
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

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCat ? t("editCategoryTitle") : t("createCategoryTitle")}
            </DialogTitle>
            <DialogDescription>{t("categoryDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCatSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{t("nameLabel")}</Label>
              <Input
                id="cat-name"
                value={catFormData.name}
                onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-color">{t("colorLabel")}</Label>
              <div className="flex gap-2">
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
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cat-requires-approval"
                checked={catFormData.requires_approval}
                onCheckedChange={(checked) =>
                  setCatFormData({ ...catFormData, requires_approval: checked === true })
                }
              />
              <Label htmlFor="cat-requires-approval">{t("requiresApprovalLabel")}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description">{t("descriptionLabel")}</Label>
              <Textarea
                id="cat-description"
                value={catFormData.description}
                onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatDialogOpen(false)}
                disabled={saving}
              >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
