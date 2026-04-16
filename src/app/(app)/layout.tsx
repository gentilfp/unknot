"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { TopNav } from "@/components/layout/TopNav";
import { BottomTabs } from "@/components/layout/BottomTabs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <TopNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-6 md:pb-6">
          {children}
        </main>
        <BottomTabs />
      </TRPCProvider>
    </SessionProvider>
  );
}
