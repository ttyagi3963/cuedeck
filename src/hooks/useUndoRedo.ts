"use client";

import { useState } from "react";

type Command = {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

type UndoRedoControls = {
  canUndo: boolean;
  canRedo: boolean;
  isRunning: boolean;
  push: (command: Command) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
};

const MAX_HISTORY = 50;

export function useUndoRedo(): UndoRedoControls {
  const [past, setPast] = useState<Command[]>([]);
  const [future, setFuture] = useState<Command[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  function push(command: Command) {
    setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), command]);
    setFuture([]);
  }

  async function undo() {
    const command = past[past.length - 1];
    if (!command || isRunning) return;

    setIsRunning(true);

    try {
      await command.undo();
      setPast((prev) => prev.slice(0, -1));
      setFuture((prev) => [...prev.slice(-(MAX_HISTORY - 1)), command]);
    } finally {
      setIsRunning(false);
    }
  }

  async function redo() {
    const command = future[future.length - 1];
    if (!command || isRunning) return;

    setIsRunning(true);

    try {
      await command.redo();
      setFuture((prev) => prev.slice(0, -1));
      setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), command]);
    } finally {
      setIsRunning(false);
    }
  }

  function clear() {
    setPast([]);
    setFuture([]);
  }

  return {
    canUndo: !isRunning && past.length > 0,
    canRedo: !isRunning && future.length > 0,
    isRunning,
    push,
    undo,
    redo,
    clear,
  };
}
