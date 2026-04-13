"use client";

import type { ReactNode } from "react";
import { useLayout } from "@/context/LayoutContext";
import SideNavigation from "@/app/_components/navigation/SideNavigation";

export default function AppGrid({ children }: { children: ReactNode }) {
  const { isSidebarCollapsed, hasMounted } = useLayout();
  const desktopColumns = isSidebarCollapsed ? "64px 1fr" : "320px 1fr";

  return (
    <>
      <style>{`
        @media (min-width: 1025px) {
          [data-app-grid] {
            grid-template-columns: ${desktopColumns};
            ${hasMounted ? "transition: grid-template-columns 300ms ease-out;" : ""}
          }
        }
      `}</style>
      <div
        data-app-grid
        className="grid min-w-0 flex-1 grid-cols-1 bg-background-page relative"
      >
        <SideNavigation />
        <main className="min-w-0 bg-background-page flex flex-col">
          {children}
        </main>
      </div>
    </>
  );
}
