"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function AppearanceSettings() {
  const t = useTranslations("settings.appearance");
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    // Update locale in URL
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/(en|de)/, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("theme")}</Label>
          <p className="text-muted-foreground text-sm">{t("themeDescription")}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
              theme === "light"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Sun className="h-6 w-6" />
            <span className="text-sm font-medium">{t("light")}</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
              theme === "dark"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Moon className="h-6 w-6" />
            <span className="text-sm font-medium">{t("dark")}</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
              theme === "system"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Monitor className="h-6 w-6" />
            <span className="text-sm font-medium">{t("system")}</span>
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label htmlFor="language">{t("language")}</Label>
        <Select value={locale} onValueChange={handleLanguageChange}>
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">{t("languageDescription")}</p>
      </div>
    </div>
  );
}
