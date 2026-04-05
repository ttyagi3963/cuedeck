"use client";

import { useRef, useState } from "react";

type UndoRedoControls = {
  canUndo: boolean;
  canRedo: boolean;
  record: (time: number) => void;
  undo: () => number | null;
  redo: () => number | null;
};

const MAX_HISTORY = 50;

export function useUndoRedo(): UndoRedoControls {
  const past = useRef<number[]>([]);
  const future = useRef<number[]>([]);
  const [, forceUpdate] = useState(0);

  function record(time: number) {
    const last = past.current[past.current.length - 1];
    // Skip duplicate consecutive entries
    if (last !== undefined && Math.abs(last - time) < 0.5) return;

    past.current.push(time);
    if (past.current.length > MAX_HISTORY) {
      past.current.shift();
    }
    future.current = [];
    forceUpdate((prev) => prev + 1);
  }

  function undo(): number | null {
    if (past.current.length < 2) return null;

    const current = past.current.pop()!;
    future.current.push(current);
    const previous = past.current[past.current.length - 1];
    forceUpdate((prev) => prev + 1);
    return previous;
  }

  function redo(): number | null {
    if (future.current.length === 0) return null;

    const next = future.current.pop()!;
    past.current.push(next);
    forceUpdate((prev) => prev + 1);
    return next;
  }

  return {
    canUndo: past.current.length >= 2,
    canRedo: future.current.length > 0,
    record,
    undo,
    redo,
  };
}
