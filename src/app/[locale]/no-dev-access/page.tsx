import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function NoDevAccessPage() {
  const t = useTranslations("devAccess");

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-6">
            <ShieldX className="text-destructive h-16 w-16" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="bg-card space-y-4 rounded-lg border p-6 text-left">
          <h2 className="font-semibold">{t("howToGetAccess")}</h2>
          <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/">{t("goToProduction")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">{t("logout")}</Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-xs">{t("environment")}</p>
      </div>
    </div>
  );
}
