"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink, Loader2 } from "lucide-react";
import type { Database } from "@/types/database";

type QuickLink = Database["public"]["Tables"]["quick_links"]["Row"];

export function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("home.quickLinks");

  useEffect(() => {
    loadQuickLinks();
  }, []);

  const loadQuickLinks = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quick_links")
        .select("*")
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error loading quick links:", error);
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
          {links.map((link) => (
            <Button
              key={link.id}
              variant="outline"
              className="h-auto flex-col items-start gap-1 py-3"
              asChild
            >
              {link.phone ? (
                <a href={`tel:${link.phone}`}>
                  <div className="flex w-full items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{link.phone}</span>
                </a>
              ) : (
                <a href={link.url!} target="_blank" rel="noopener noreferrer">
                  <div className="flex w-full items-center gap-2">
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <span className="text-muted-foreground truncate text-xs">{link.url}</span>
                </a>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
