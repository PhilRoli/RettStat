"use client";

import { Providers } from "@/components/providers";
import enMessages from "@/i18n/messages/en.json";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers locale="en" messages={enMessages}>
      {children}
    </Providers>
  );
}
