"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

type LayoutContextValue = {
  isSidebarCollapsed: boolean;
  hasMounted: boolean;
  toggleSidebar: () => void;
  isTranscriptPanelOpen: boolean;
  openTranscriptPanel: () => void;
  closeTranscriptPanel: () => void;
  toggleTranscriptPanel: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isTranscriptPanelOpen, setIsTranscriptPanelOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") {
      setIsSidebarCollapsed(true);
    }
    setHasMounted(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const openTranscriptPanel = useCallback(
    () => setIsTranscriptPanelOpen(true),
    [],
  );
  const closeTranscriptPanel = useCallback(
    () => setIsTranscriptPanelOpen(false),
    [],
  );
  const toggleTranscriptPanel = useCallback(
    () => setIsTranscriptPanelOpen((prev) => !prev),
    [],
  );

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        hasMounted,
        toggleSidebar,
        isTranscriptPanelOpen,
        openTranscriptPanel,
        closeTranscriptPanel,
        toggleTranscriptPanel,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return ctx;
}
