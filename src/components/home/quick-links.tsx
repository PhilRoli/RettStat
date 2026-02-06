"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getPb } from "@/lib/pocketbase";
import type { QuickLinkRecord } from "@/lib/pocketbase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink, Loader2 } from "lucide-react";

export function QuickLinks() {
  const [links, setLinks] = useState<QuickLinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("home.quickLinks");

  useEffect(() => {
    loadQuickLinks();
  }, []);

  const loadQuickLinks = async () => {
    try {
      const result = await getPb().collection("quick_links").getFullList<QuickLinkRecord>({
        filter: `is_enabled=true`,
        sort: "order",
      });

      setLinks(result);
    } catch (error) {
      // Gracefully handle missing collection (404) vs actual errors
      if (error instanceof Error && !error.message.includes("404")) {
        console.error("Error loading quick links:", error);
      }
    } finally {
      setIsLoading(false);
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

  if (links.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => {
            const isPhone = link.url?.startsWith("tel:");
            return (
              <Button
                key={link.id}
                variant="outline"
                className="h-auto flex-col items-start gap-1 py-3"
                asChild
              >
                {isPhone ? (
                  <a href={link.url}>
                    <div className="flex w-full items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{link.title}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {link.url?.replace("tel:", "")}
                    </span>
                  </a>
                ) : (
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <div className="flex w-full items-center gap-2">
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{link.title}</span>
                    </div>
                    <span className="text-muted-foreground truncate text-xs">{link.url}</span>
                  </a>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
