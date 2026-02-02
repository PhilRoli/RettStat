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
import { Loader2, Plus, Edit, Trash2, Upload, FileText, X } from "lucide-react";
import type { Database } from "@/types/database";
import type { NewsCategory } from "@/types/database";

type News = Database["public"]["Tables"]["news"]["Row"];
type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];
type NewsAttachment = Database["public"]["Tables"]["news_attachments"]["Row"];
type Unit = Database["public"]["Tables"]["units"]["Row"];

interface NewsWithAttachments extends News {
  news_attachments?: NewsAttachment[];
}

export function NewsManagement() {
  const t = useTranslations("admin.news");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [news, setNews] = useState<NewsWithAttachments[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAttachmentDialog, setDeleteAttachmentDialog] = useState(false);

  const [selectedNews, setSelectedNews] = useState<NewsWithAttachments | null>(null);
  const [deleteNewsId, setDeleteNewsId] = useState<string | null>(null);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general" as NewsCategory,
    target_unit_ids: [] as string[],
    is_published: false,
  });

  const [attachments, setAttachments] = useState<NewsAttachment[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [newsRes, unitsRes] = await Promise.all([
        supabase
          .from("news")
          .select("*, news_attachments(*)")
          .order("created_at", { ascending: false }),
        supabase.from("units").select("*").order("name", { ascending: true }),
      ]);

      if (newsRes.error) throw newsRes.error;
      if (unitsRes.error) throw unitsRes.error;

      setNews((newsRes.data as NewsWithAttachments[]) || []);
      setUnits(unitsRes.data || []);
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

  const handleCreate = () => {
    setSelectedNews(null);
    setFormData({
      title: "",
      content: "",
      category: "general",
      target_unit_ids: [],
      is_published: false,
    });
    setAttachments([]);
    setDialogOpen(true);
  };

  const handleEdit = (newsItem: NewsWithAttachments) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category,
      target_unit_ids: newsItem.target_unit_ids || [],
      is_published: newsItem.published_at !== null,
    });
    setAttachments(newsItem.news_attachments || []);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const newsData: NewsInsert = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        target_unit_ids: formData.target_unit_ids.length > 0 ? formData.target_unit_ids : null,
        published_at: formData.is_published ? new Date().toISOString() : null,
      };

      if (selectedNews) {
        const { error } = await supabase
          .from("news")
          // @ts-expect-error - Supabase generated types are overly strict for updates
          .update(newsData)
          .eq("id", selectedNews.id);

        if (error) throw error;

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        const { error } = await supabase
          .from("news")
          // @ts-expect-error - Supabase generated types are overly strict for inserts
          .insert(newsData);

        if (error) throw error;

        toast({
          title: t("createSuccessTitle"),
          description: t("createSuccessDescription"),
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving news:", error);
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
    setDeleteNewsId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteNewsId) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Delete attachments from storage and database
      const newsItem = news.find((n) => n.id === deleteNewsId);
      if (newsItem?.news_attachments) {
        for (const attachment of newsItem.news_attachments) {
          await supabase.storage.from("news-attachments").remove([attachment.file_path]);
        }
      }

      const { error } = await supabase.from("news").delete().eq("id", deleteNewsId);

      if (error) throw error;

      toast({
        title: t("deleteSuccessTitle"),
        description: t("deleteSuccessDescription"),
      });

      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        variant: "destructive",
        title: t("deleteErrorTitle"),
        description: t("deleteErrorDescription"),
      });
    } finally {
      setSaving(false);
      setDeleteNewsId(null);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedNews) return;

    setUploading(true);
    try {
      const supabase = createClient();

      const fileName = `${selectedNews.id}/${Date.now()}-${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("news-attachments")
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("news_attachments")
        // @ts-expect-error - Supabase generated types are overly strict for inserts
        .insert({
          news_id: selectedNews.id,
          file_name: uploadFile.name,
          file_path: fileName,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
        });

      if (dbError) throw dbError;

      toast({
        title: t("uploadSuccessTitle"),
        description: t("uploadSuccessDescription"),
      });

      setUploadFile(null);
      fetchData();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: t("uploadErrorTitle"),
        description: t("uploadErrorDescription"),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = (id: string) => {
    setDeleteAttachmentId(id);
    setDeleteAttachmentDialog(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!deleteAttachmentId) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const attachment = attachments.find((a) => a.id === deleteAttachmentId);
      if (!attachment) return;

      await supabase.storage.from("news-attachments").remove([attachment.file_path]);

      const { error } = await supabase
        .from("news_attachments")
        .delete()
        .eq("id", deleteAttachmentId);

      if (error) throw error;

      toast({
        title: t("deleteAttachmentSuccessTitle"),
        description: t("deleteAttachmentSuccessDescription"),
      });

      setDeleteAttachmentDialog(false);
      setAttachments(attachments.filter((a) => a.id !== deleteAttachmentId));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast({
        variant: "destructive",
        title: t("deleteAttachmentErrorTitle"),
        description: t("deleteAttachmentErrorDescription"),
      });
    } finally {
      setSaving(false);
      setDeleteAttachmentId(null);
    }
  };

  const toggleUnit = (unitId: string) => {
    setFormData((prev) => ({
      ...prev,
      target_unit_ids: prev.target_unit_ids.includes(unitId)
        ? prev.target_unit_ids.filter((id) => id !== unitId)
        : [...prev.target_unit_ids, unitId],
    }));
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
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

      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createNews")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("titleColumn")}</TableHead>
              <TableHead>{t("categoryColumn")}</TableHead>
              <TableHead>{t("targetUnitsColumn")}</TableHead>
              <TableHead>{t("publishedColumn")}</TableHead>
              <TableHead>{t("createdColumn")}</TableHead>
              <TableHead className="w-[100px]">{t("actionsColumn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  {t("noNews")}
                </TableCell>
              </TableRow>
            ) : (
              news.map((newsItem) => (
                <TableRow key={newsItem.id}>
                  <TableCell className="font-medium">{newsItem.title}</TableCell>
                  <TableCell className="capitalize">{newsItem.category}</TableCell>
                  <TableCell>
                    {newsItem.target_unit_ids
                      ? `${newsItem.target_unit_ids.length} ${t("units")}`
                      : t("allUnits")}
                  </TableCell>
                  <TableCell>{newsItem.published_at ? t("yes") : t("no")}</TableCell>
                  <TableCell>{formatDate(newsItem.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(newsItem)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(newsItem.id)}>
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

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNews ? t("editNewsTitle") : t("createNewsTitle")}</DialogTitle>
            <DialogDescription>{t("newsDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">{t("titleLabel")}</Label>
              <Input
                id="news-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-content">{t("contentLabel")}</Label>
              <Textarea
                id="news-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-category">{t("categoryLabel")}</Label>
              <Select
                value={formData.category}
                onValueChange={(value: NewsCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="news-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t("categoryGeneral")}</SelectItem>
                  <SelectItem value="important">{t("categoryImportant")}</SelectItem>
                  <SelectItem value="event">{t("categoryEvent")}</SelectItem>
                  <SelectItem value="training">{t("categoryTraining")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("targetUnitsLabel")}</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-4">
                {units.map((unit) => (
                  <div key={unit.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unit-${unit.id}`}
                      checked={formData.target_unit_ids.includes(unit.id)}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <label
                      htmlFor={`unit-${unit.id}`}
                      className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {unit.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">{t("targetUnitsHint")}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked as boolean })
                }
              />
              <label
                htmlFor="is-published"
                className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("publishedLabel")}
              </label>
            </div>

            {selectedNews && (
              <div className="space-y-2">
                <Label>{t("attachmentsLabel")}</Label>
                <div className="space-y-2 rounded-md border p-4">
                  {attachments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t("noAttachments")}</p>
                  ) : (
                    attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="bg-muted flex items-center justify-between rounded p-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment.file_name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({Math.round((attachment.file_size || 0) / 1024)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!uploadFile || uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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

      {/* Delete News Confirmation */}
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

      {/* Delete Attachment Confirmation */}
      <AlertDialog open={deleteAttachmentDialog} onOpenChange={setDeleteAttachmentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAttachmentDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteAttachmentDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAttachment} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
