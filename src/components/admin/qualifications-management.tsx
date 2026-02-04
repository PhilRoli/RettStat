"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getPb } from "@/lib/pocketbase";
import type { QualificationRecord, QualificationCategoryRecord } from "@/lib/pocketbase/types";
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

interface QualificationWithCategory extends QualificationRecord {
  expand?: {
    category?: QualificationCategoryRecord;
  };
}

export function QualificationsManagement() {
  const t = useTranslations("admin.qualifications");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [qualifications, setQualifications] = useState<QualificationWithCategory[]>([]);
  const [categories, setCategories] = useState<QualificationCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [qualDialogOpen, setQualDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedQual, setSelectedQual] = useState<QualificationWithCategory | null>(null);
  const [selectedCat, setSelectedCat] = useState<QualificationCategoryRecord | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "qual" | "cat"; id: string } | null>(null);

  const [qualFormData, setQualFormData] = useState({
    name: "",
    category: "",
    description: "",
    validity_months: undefined as number | undefined,
  });

  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [qualsRes, catsRes] = await Promise.all([
        getPb().collection("qualifications").getFullList<QualificationWithCategory>({
          sort: "name",
          expand: "category",
        }),
        getPb().collection("qualification_categories").getFullList<QualificationCategoryRecord>({
          sort: "sort_order,name",
        }),
      ]);

      setQualifications(qualsRes);
      setCategories(catsRes);
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
      category: "",
      description: "",
      validity_months: undefined,
    });
    setQualDialogOpen(true);
  };

  const handleQualEdit = (qual: QualificationWithCategory) => {
    setSelectedQual(qual);
    setQualFormData({
      name: qual.name,
      category: qual.category || "",
      description: qual.description || "",
      validity_months: qual.validity_months,
    });
    setQualDialogOpen(true);
  };

  const handleQualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const qualData = {
        name: qualFormData.name,
        category: qualFormData.category || "",
        description: qualFormData.description || "",
        validity_months: qualFormData.validity_months,
      };

      if (selectedQual) {
        await getPb().collection("qualifications").update(selectedQual.id, qualData);

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        await getPb().collection("qualifications").create(qualData);

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
      sort_order: categories.length,
    });
    setCatDialogOpen(true);
  };

  const handleCatEdit = (cat: QualificationCategoryRecord) => {
    setSelectedCat(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || "",
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
        description: catFormData.description || "",
        sort_order: catFormData.sort_order,
      };

      if (selectedCat) {
        await getPb().collection("qualification_categories").update(selectedCat.id, catData);

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        await getPb().collection("qualification_categories").create(catData);

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
      if (deleteItem.type === "qual") {
        await getPb().collection("qualifications").delete(deleteItem.id);
      } else {
        await getPb().collection("qualification_categories").delete(deleteItem.id);
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
                    <TableHead>{t("categoryColumn")}</TableHead>
                    <TableHead className="w-24">{t("validityMonthsColumn")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("descriptionColumn")}</TableHead>
                    <TableHead className="text-right">{t("actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {t("noQualifications")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    qualifications.map((qual) => (
                      <TableRow key={qual.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            {qual.name}
                          </div>
                        </TableCell>
                        <TableCell>{qual.expand?.category?.name || t("noCategory")}</TableCell>
                        <TableCell>{qual.validity_months ?? "-"}</TableCell>
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
        <DialogContent className="sm:max-w-lg">
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
                <Label htmlFor="qual-cat">{t("categoryLabel")}</Label>
                <Select
                  value={qualFormData.category}
                  onValueChange={(value) => setQualFormData({ ...qualFormData, category: value })}
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
                <Label htmlFor="qual-validity">{t("validityMonthsLabel")}</Label>
                <Input
                  id="qual-validity"
                  type="number"
                  min="0"
                  value={qualFormData.validity_months ?? ""}
                  onChange={(e) =>
                    setQualFormData({
                      ...qualFormData,
                      validity_months: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder={t("validityMonthsPlaceholder")}
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
                <Label htmlFor="cat-sort">{t("sortOrderLabel")}</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  min="0"
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
