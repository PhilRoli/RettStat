"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
