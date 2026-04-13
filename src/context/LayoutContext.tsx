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
  const [userToggledTranscript, setUserToggledTranscript] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") {
      setIsSidebarCollapsed(true);
    }
    // Auto-open transcript on wide screens
    if (window.innerWidth >= 1680) {
      setIsTranscriptPanelOpen(true);
    }
    setHasMounted(true);
  }, []);

  // Auto-open/close transcript on resize unless user has manually toggled
  useEffect(() => {
    if (!hasMounted || userToggledTranscript) return;

    function handleResize() {
      setIsTranscriptPanelOpen(window.innerWidth >= 1680);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasMounted, userToggledTranscript]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const openTranscriptPanel = useCallback(() => {
    setUserToggledTranscript(true);
    setIsTranscriptPanelOpen(true);
  }, []);
  const closeTranscriptPanel = useCallback(() => {
    setUserToggledTranscript(true);
    setIsTranscriptPanelOpen(false);
  }, []);
  const toggleTranscriptPanel = useCallback(() => {
    setUserToggledTranscript(true);
    setIsTranscriptPanelOpen((prev) => !prev);
  }, []);

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
