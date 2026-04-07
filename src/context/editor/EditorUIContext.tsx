"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Marker } from "@/contracts/marker";

type EditorUIContextValue = {
  isCreateDialogOpen: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  editingMarker: Marker | null;
  openEditDialog: (marker: Marker) => void;
  closeEditDialog: () => void;
};

const EditorUIContext = createContext<EditorUIContextValue | null>(null);

type EditorUIProviderProps = {
  children: ReactNode;
};

export function EditorUIProvider({ children }: EditorUIProviderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);

  return (
    <EditorUIContext.Provider
      value={{
        isCreateDialogOpen,
        openCreateDialog: () => setIsCreateDialogOpen(true),
        closeCreateDialog: () => setIsCreateDialogOpen(false),
        editingMarker,
        openEditDialog: (marker: Marker) => setEditingMarker(marker),
        closeEditDialog: () => setEditingMarker(null),
      }}
    >
      {children}
    </EditorUIContext.Provider>
  );
}

export function useEditorUI(): EditorUIContextValue {
  const ctx = useContext(EditorUIContext);
  if (!ctx) {
    throw new Error("useEditorUI must be used within an EditorUIProvider");
  }
  return ctx;
}
