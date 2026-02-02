import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
              <Mail className="text-primary h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-center">{t("checkYourEmail")}</CardTitle>
          <CardDescription className="text-center">{t("verificationSent")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-sm">
            {t("didntReceiveEmail")}{" "}
            <a href="/auth/register" className="text-primary hover:underline">
              {t("tryAgain")}
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
