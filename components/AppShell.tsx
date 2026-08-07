"use client";

import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell-wrap">
      <div className="app">
        <BottomNav />
        <div className="scroll-area" id="scrollArea">
          {children}
        </div>
      </div>
    </div>
  );
}
