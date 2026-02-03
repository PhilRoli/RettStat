"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { getPb } from "@/lib/pocketbase";
import type {
  NewsRecord,
  NewsAttachmentRecord,
  NewsReadStatusRecord,
} from "@/lib/pocketbase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";

type NewsCategory = "general" | "emergency" | "training" | "event" | "maintenance" | "policy";
type NewsPriority = "low" | "normal" | "high" | "urgent";

type NewsWithRelations = NewsRecord & {
  priority?: NewsPriority;
  category?: NewsCategory;
  news_read_status: NewsReadStatusRecord[];
  news_attachments: NewsAttachmentRecord[];
};

export function NewsFeed() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | "all">("all");
  const t = useTranslations("home.news");

  const categories: (NewsCategory | "all")[] = [
    "all",
    "general",
    "emergency",
    "training",
    "event",
    "maintenance",
    "policy",
  ];

  useEffect(() => {
    if (user) {
      loadNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCategory]);

  const loadNews = async () => {
    try {
      const filter = selectedCategory !== "all" ? `category="${selectedCategory}"` : "";

      const pb = getPb();
      const newsItems = await pb.collection("news").getList<NewsRecord>(1, 10, {
        filter,
        sort: "-published_at",
      });

      // Fetch read status and attachments for each news item
      const newsWithRelations = await Promise.all(
        newsItems.items.map(async (item) => {
          const [readStatus, attachments] = await Promise.all([
            pb
              .collection("news_read_status")
              .getFullList<NewsReadStatusRecord>({
                filter: `news="${item.id}" && user="${user?.id}"`,
              })
              .catch(() => []),
            pb
              .collection("news_attachments")
              .getFullList<NewsAttachmentRecord>({
                filter: `news="${item.id}"`,
              })
              .catch(() => []),
          ]);

          return {
            ...item,
            news_read_status: readStatus,
            news_attachments: attachments,
          } as NewsWithRelations;
        })
      );

      setNews(newsWithRelations);
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (newsId: string) => {
    if (!user) return;

    try {
      const pb = getPb();
      await pb.collection("news_read_status").create({
        news: newsId,
        user: user.id,
        read_at: new Date().toISOString(),
      });

      // Update local state
      setNews((prev) =>
        prev.map((item) =>
          item.id === newsId
            ? {
                ...item,
                news_read_status: [{ read_at: new Date().toISOString() } as NewsReadStatusRecord],
              }
            : item
        )
      );
    } catch (error) {
      console.error("Error marking news as read:", error);
    }
  };

  const isUnread = (item: NewsWithRelations) => {
    return item.news_read_status.length === 0;
  };

  const getPriorityColor = (priority?: NewsPriority) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Category Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {t(`categories.${category}`)}
            </Button>
          ))}
        </div>

        {/* News List */}
        <div className="space-y-4">
          {news.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">{t("noNews")}</p>
          ) : (
            news.map((item) => (
              <div
                key={item.id}
                className="hover:bg-accent rounded-lg border p-4 transition-colors"
                onClick={() => isUnread(item) && markAsRead(item.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-base font-semibold ${isUnread(item) ? "font-bold" : ""}`}
                      >
                        {item.title}
                      </h3>
                      {isUnread(item) && (
                        <Badge variant="default" className="text-xs">
                          {t("new")}
                        </Badge>
                      )}
                    </div>
                    {item.priority && item.priority !== "normal" && (
                      <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                        {t(`priority.${item.priority}`)}
                      </Badge>
                    )}
                    <p className="text-muted-foreground line-clamp-2 text-sm">{item.content}</p>
                    {item.news_attachments && item.news_attachments.length > 0 && (
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <FileText className="h-3 w-3" />
                        <span>
                          {item.news_attachments.length}{" "}
                          {t("attachments", { count: item.news_attachments.length })}
                        </span>
                      </div>
                    )}
                  </div>
                  {item.published_at && (
                    <time className="text-muted-foreground text-xs">
                      {new Date(item.published_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
