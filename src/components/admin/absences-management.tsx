"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";

type Absence = Database["public"]["Tables"]["absences"]["Row"];
type AbsenceInsert = Database["public"]["Tables"]["absences"]["Insert"];
type AbsenceCategory = Database["public"]["Tables"]["absence_categories"]["Row"];
type AbsenceCategoryInsert = Database["public"]["Tables"]["absence_categories"]["Insert"];

interface AbsenceWithCategory extends Absence {
  absence_categories?: AbsenceCategory | null;
}

export function AbsencesManagement() {
  const t = useTranslations("admin.absences");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [absences, setAbsences] = useState<AbsenceWithCategory[]>([]);
  const [categories, setCategories] = useState<AbsenceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceWithCategory | null>(null);
  const [selectedCat, setSelectedCat] = useState<AbsenceCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "absence" | "cat"; id: string } | null>(
    null
  );

  const [absenceFormData, setAbsenceFormData] = useState({
    name: "",
    category_id: "",
    description: "",
  });

  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [absencesRes, catsRes] = await Promise.all([
        supabase
          .from("absences")
          .select("*, absence_categories(*)")
          .order("name", { ascending: true }),
        supabase.from("absence_categories").select("*").order("name", { ascending: true }),
      ]);

      if (absencesRes.error) throw absencesRes.error;
      if (catsRes.error) throw catsRes.error;

      setAbsences((absencesRes.data as AbsenceWithCategory[]) || []);
      setCategories(catsRes.data || []);
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

  const handleAbsenceCreate = () => {
    setSelectedAbsence(null);
    setAbsenceFormData({
      name: "",
      category_id: "",
      description: "",
    });
    setAbsenceDialogOpen(true);
  };

  const handleAbsenceEdit = (absence: AbsenceWithCategory) => {
    setSelectedAbsence(absence);
    setAbsenceFormData({
      name: absence.name,
      category_id: absence.category_id || "",
      description: absence.description || "",
    });
    setAbsenceDialogOpen(true);
  };

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const absenceData: AbsenceInsert = {
        name: absenceFormData.name,
        category_id: absenceFormData.category_id || null,
        description: absenceFormData.description || null,
      };

      if (selectedAbsence) {
        const { error } = await supabase
          .from("absences")
          // @ts-expect-error - Supabase generated types are overly strict for updates
          .update(absenceData)
          .eq("id", selectedAbsence.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        const { error } = await supabase
          .from("absences")
          // @ts-expect-error - Supabase generated types are overly strict for inserts
          .insert(absenceData);

        if (error) throw error;

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setAbsenceDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving absence:", error);
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

  const handleCatEdit = (cat: AbsenceCategory) => {
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

      const catData: AbsenceCategoryInsert = {
        name: catFormData.name,
        description: catFormData.description || null,
        icon: catFormData.icon || null,
      };

      if (selectedCat) {
        const { error } = await supabase
          .from("absence_categories")
          // @ts-expect-error - Supabase generated types are overly strict for updates
          .update(catData)
          .eq("id", selectedCat.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        const { error } = await supabase
          .from("absence_categories")
          // @ts-expect-error - Supabase generated types are overly strict for inserts
          .insert(catData);

        if (error) throw error;

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

  const handleDelete = (type: "absence" | "cat", id: string) => {
    setDeleteItem({ type, id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const table = deleteItem.type === "absence" ? "absences" : "absence_categories";
      const { error } = await supabase.from(table).delete().eq("id", deleteItem.id);

      if (error) throw error;

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

      <Tabs defaultValue="absences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="absences">{t("absencesTab")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categoriesTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="absences" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAbsenceCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createAbsence")}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("nameColumn")}</TableHead>
                  <TableHead>{t("categoryColumn")}</TableHead>
                  <TableHead>{t("descriptionColumn")}</TableHead>
                  <TableHead className="w-25">{t("actionsColumn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      {t("noAbsences")}
                    </TableCell>
                  </TableRow>
                ) : (
                  absences.map((absence) => (
                    <TableRow key={absence.id}>
                      <TableCell className="font-medium">{absence.name}</TableCell>
                      <TableCell>{absence.absence_categories?.name || t("noCategory")}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {absence.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAbsenceEdit(absence)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete("absence", absence.id)}
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
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
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
                  <TableHead>{t("descriptionColumn")}</TableHead>
                  <TableHead>{t("iconColumn")}</TableHead>
                  <TableHead className="w-25">{t("actionsColumn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      {t("noCategories")}
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>{category.icon || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCatEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete("cat", category.id)}
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
        </TabsContent>
      </Tabs>

      {/* Absence Dialog */}
      <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAbsence ? t("editAbsenceTitle") : t("createAbsenceTitle")}
            </DialogTitle>
            <DialogDescription>{t("absenceDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAbsenceSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="absence-name">{t("nameLabel")}</Label>
              <Input
                id="absence-name"
                value={absenceFormData.name}
                onChange={(e) => setAbsenceFormData({ ...absenceFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absence-category">{t("categoryLabel")}</Label>
              <Select
                value={absenceFormData.category_id}
                onValueChange={(value) =>
                  setAbsenceFormData({ ...absenceFormData, category_id: value })
                }
              >
                <SelectTrigger id="absence-category">
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noCategory")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="absence-description">{t("descriptionLabel")}</Label>
              <Textarea
                id="absence-description"
                value={absenceFormData.description}
                onChange={(e) =>
                  setAbsenceFormData({ ...absenceFormData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbsenceDialogOpen(false)}
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
              <Label htmlFor="cat-description">{t("descriptionLabel")}</Label>
              <Textarea
                id="cat-description"
                value={catFormData.description}
                onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-icon">{t("iconLabel")}</Label>
              <Input
                id="cat-icon"
                value={catFormData.icon}
                onChange={(e) => setCatFormData({ ...catFormData, icon: e.target.value })}
                placeholder="e.g., lucide-icon-name"
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
