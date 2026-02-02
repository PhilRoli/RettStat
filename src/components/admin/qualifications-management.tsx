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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Edit, Trash2, Award } from "lucide-react";
import type { Database } from "@/types/database";

type Qualification = Database["public"]["Tables"]["qualifications"]["Row"];
type QualificationInsert = Database["public"]["Tables"]["qualifications"]["Insert"];
type QualificationCategory = Database["public"]["Tables"]["qualification_categories"]["Row"];
type QualificationCategoryInsert =
  Database["public"]["Tables"]["qualification_categories"]["Insert"];

interface QualificationWithCategory extends Qualification {
  qualification_categories?: QualificationCategory | null;
}

export function QualificationsManagement() {
  const t = useTranslations("admin.qualifications");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [qualifications, setQualifications] = useState<QualificationWithCategory[]>([]);
  const [categories, setCategories] = useState<QualificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [qualDialogOpen, setQualDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedQual, setSelectedQual] = useState<QualificationWithCategory | null>(null);
  const [selectedCat, setSelectedCat] = useState<QualificationCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "qual" | "cat"; id: string } | null>(null);

  const [qualFormData, setQualFormData] = useState({
    name: "",
    abbreviation: "",
    category_id: "",
    level: 1,
    description: "",
    icon: "",
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

      const [qualsRes, catsRes] = await Promise.all([
        supabase
          .from("qualifications")
          .select("*, qualification_categories(*)")
          .order("level", { ascending: true }),
        supabase.from("qualification_categories").select("*").order("name", { ascending: true }),
      ]);

      if (qualsRes.error) throw qualsRes.error;
      if (catsRes.error) throw catsRes.error;

      setQualifications((qualsRes.data as QualificationWithCategory[]) || []);
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

  const handleQualCreate = () => {
    setSelectedQual(null);
    setQualFormData({
      name: "",
      abbreviation: "",
      category_id: "",
      level: 1,
      description: "",
      icon: "",
    });
    setQualDialogOpen(true);
  };

  const handleQualEdit = (qual: QualificationWithCategory) => {
    setSelectedQual(qual);
    setQualFormData({
      name: qual.name,
      abbreviation: qual.abbreviation || "",
      category_id: qual.category_id || "",
      level: qual.level || 1,
      description: qual.description || "",
      icon: qual.icon || "",
    });
    setQualDialogOpen(true);
  };

  const handleQualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const qualData: QualificationInsert = {
        name: qualFormData.name,
        abbreviation: qualFormData.abbreviation || null,
        category_id: qualFormData.category_id || null,
        level: qualFormData.level,
        description: qualFormData.description || null,
        icon: qualFormData.icon || null,
      };

      if (selectedQual) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("qualifications")
          .update(qualData)
          .eq("id", selectedQual.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("qualifications").insert(qualData);

        if (error) throw error;

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setQualDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving qualification:", error);
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

  const handleCatEdit = (cat: QualificationCategory) => {
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

      const catData: QualificationCategoryInsert = {
        name: catFormData.name,
        description: catFormData.description || null,
        icon: catFormData.icon || null,
      };

      if (selectedCat) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("qualification_categories")
          .update(catData)
          .eq("id", selectedCat.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("qualification_categories").insert(catData);

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

  const handleDeleteClick = (type: "qual" | "cat", id: string) => {
    setDeleteItem({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    setSaving(true);

    try {
      const supabase = createClient();

      if (deleteItem.type === "qual") {
        const { error } = await supabase.from("qualifications").delete().eq("id", deleteItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("qualification_categories")
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

      <Tabs defaultValue="qualifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="qualifications">{t("qualificationsTab")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categoriesTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="qualifications" className="space-y-4">
          <div className="flex justify-between">
            <div />
            <Button onClick={handleQualCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createQualification")}
            </Button>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nameColumn")}</TableHead>
                    <TableHead>{t("abbreviationColumn")}</TableHead>
                    <TableHead>{t("categoryColumn")}</TableHead>
                    <TableHead className="w-20">{t("levelColumn")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("descriptionColumn")}</TableHead>
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t("noQualifications")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    qualifications.map((qual) => (
                      <TableRow key={qual.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {qual.icon && <Award className="h-4 w-4" />}
                            {qual.name}
                          </div>
                        </TableCell>
                        <TableCell>{qual.abbreviation || "-"}</TableCell>
                        <TableCell>
                          {qual.qualification_categories?.name || t("noCategory")}
                        </TableCell>
                        <TableCell>{qual.level}</TableCell>
                        <TableCell className="hidden max-w-xs truncate lg:table-cell">
                          {qual.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQualEdit(qual)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick("qual", qual.id)}
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
      </Tabs>

      {/* Qualification Dialog */}
      <Dialog open={qualDialogOpen} onOpenChange={setQualDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {selectedQual ? t("editQualificationTitle") : t("createQualificationTitle")}
            </DialogTitle>
            <DialogDescription>{t("qualificationDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQualSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="qual-name">{t("nameLabel")}</Label>
                <Input
                  id="qual-name"
                  value={qualFormData.name}
                  onChange={(e) => setQualFormData({ ...qualFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qual-abbr">{t("abbreviationLabel")}</Label>
                <Input
                  id="qual-abbr"
                  value={qualFormData.abbreviation}
                  onChange={(e) =>
                    setQualFormData({ ...qualFormData, abbreviation: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qual-cat">{t("categoryLabel")}</Label>
                <Select
                  value={qualFormData.category_id}
                  onValueChange={(value) =>
                    setQualFormData({ ...qualFormData, category_id: value })
                  }
                >
                  <SelectTrigger id="qual-cat">
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
                <Label htmlFor="qual-level">{t("levelLabel")}</Label>
                <Input
                  id="qual-level"
                  type="number"
                  min="1"
                  value={qualFormData.level}
                  onChange={(e) =>
                    setQualFormData({ ...qualFormData, level: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qual-desc">{t("descriptionLabel")}</Label>
                <Textarea
                  id="qual-desc"
                  value={qualFormData.description}
                  onChange={(e) =>
                    setQualFormData({ ...qualFormData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qual-icon">{t("iconLabel")}</Label>
                <Input
                  id="qual-icon"
                  value={qualFormData.icon}
                  onChange={(e) => setQualFormData({ ...qualFormData, icon: e.target.value })}
                  placeholder="award"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQualDialogOpen(false)}>
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
