import { RegisterForm } from "@/components/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
};

// Force dynamic rendering to avoid SSR issues with client-side auth state
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
