"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { pb } from "@/lib/pocketbase";
import type { NewsRecord, NewsAttachmentRecord, UnitRecord } from "@/lib/pocketbase/types";
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

type NewsCategory = "general" | "important" | "event" | "training";

interface NewsWithAttachments extends NewsRecord {
  expand?: {
    "news_attachments(news)"?: NewsAttachmentRecord[];
  };
}

export function NewsManagement() {
  const t = useTranslations("admin.news");
  const tCommon = useTranslations("common");
  const { toast } = useToast();

  const [news, setNews] = useState<NewsWithAttachments[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
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
    unit: "" as string,
    is_published: false,
    is_pinned: false,
  });

  const [attachments, setAttachments] = useState<NewsAttachmentRecord[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [newsRes, unitsRes] = await Promise.all([
        pb.collection("news").getFullList<NewsWithAttachments>({
          sort: "-created",
          expand: "news_attachments(news)",
        }),
        pb.collection("units").getFullList<UnitRecord>({
          sort: "name",
        }),
      ]);

      setNews(newsRes);
      setUnits(unitsRes);
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
      unit: "",
      is_published: false,
      is_pinned: false,
    });
    setAttachments([]);
    setDialogOpen(true);
  };

  const handleEdit = (newsItem: NewsWithAttachments) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      category: "general" as NewsCategory,
      unit: newsItem.unit || "",
      is_published: newsItem.published_at !== null,
      is_pinned: newsItem.is_pinned,
    });
    setAttachments(newsItem.expand?.["news_attachments(news)"] || []);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newsData = {
        title: formData.title,
        content: formData.content,
        unit: formData.unit || null,
        published_at: formData.is_published ? new Date().toISOString() : null,
        is_pinned: formData.is_pinned,
        author: pb.authStore.record?.id,
      };

      if (selectedNews) {
        await pb.collection("news").update(selectedNews.id, newsData);

        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDescription"),
        });
      } else {
        await pb.collection("news").create(newsData);

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
      // Delete attachments first (PocketBase cascades or we delete manually)
      const newsItem = news.find((n) => n.id === deleteNewsId);
      const newsAttachments = newsItem?.expand?.["news_attachments(news)"] || [];
      for (const attachment of newsAttachments) {
        await pb.collection("news_attachments").delete(attachment.id);
      }

      await pb.collection("news").delete(deleteNewsId);

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

    // Security validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (uploadFile.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: t("uploadErrorTitle"),
        description: t("fileTooLarge"),
      });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(uploadFile.type)) {
      toast({
        variant: "destructive",
        title: t("uploadErrorTitle"),
        description: t("invalidFileType"),
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("news", selectedNews.id);
      formData.append("file", uploadFile);
      formData.append("filename", uploadFile.name);
      formData.append("file_size", uploadFile.size.toString());

      await pb.collection("news_attachments").create(formData);

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
      await pb.collection("news_attachments").delete(deleteAttachmentId);

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

  const handleUnitChange = (unitId: string) => {
    setFormData((prev) => ({
      ...prev,
      unit: unitId === "all" ? "" : unitId,
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
              <TableHead>{t("targetUnitsColumn")}</TableHead>
              <TableHead>{t("pinnedColumn")}</TableHead>
              <TableHead>{t("publishedColumn")}</TableHead>
              <TableHead>{t("createdColumn")}</TableHead>
              <TableHead className="w-25">{t("actionsColumn")}</TableHead>
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
                  <TableCell>
                    {newsItem.unit
                      ? units.find((u) => u.id === newsItem.unit)?.name || t("unknownUnit")
                      : t("allUnits")}
                  </TableCell>
                  <TableCell>{newsItem.is_pinned ? t("yes") : t("no")}</TableCell>
                  <TableCell>{newsItem.published_at ? t("yes") : t("no")}</TableCell>
                  <TableCell>{formatDate(newsItem.created)}</TableCell>
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
              <Label htmlFor="news-unit">{t("targetUnitsLabel")}</Label>
              <Select value={formData.unit || "all"} onValueChange={handleUnitChange}>
                <SelectTrigger id="news-unit">
                  <SelectValue placeholder={t("allUnits")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allUnits")}</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">{t("targetUnitsHint")}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-pinned"
                checked={formData.is_pinned}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_pinned: checked as boolean })
                }
              />
              <label
                htmlFor="is-pinned"
                className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("pinnedLabel")}
              </label>
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
                          <span className="text-sm">{attachment.filename}</span>
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
