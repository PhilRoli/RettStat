import { LoginForm } from "@/components/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

// Force dynamic rendering to avoid SSR issues with client-side auth state
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
