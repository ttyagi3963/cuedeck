"use client";

import { useEffect, useRef } from "react";
import { INPUT_TAGS } from "@/lib/constants";

type KeyMap = Record<string, () => void>;

export function useKeyboardShortcuts(keyMap: KeyMap) {
  const keyMapRef = useRef(keyMap);
  keyMapRef.current = keyMap;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (INPUT_TAGS.has(target.tagName) || target.isContentEditable) return;

      const action = keyMapRef.current[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
