"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="text-destructive h-12 w-12" />
        <h2 className="text-2xl font-semibold">Admin Error</h2>
        <p className="text-muted-foreground max-w-md">
          An error occurred in the admin section. This might be a permissions issue or a temporary
          problem.
        </p>
        <div className="mt-4 flex gap-4">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
