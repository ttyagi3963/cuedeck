import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "@/hooks/useUndoRedo";

function makeCommand(log: string[]) {
  return {
    undo: async () => {
      log.push("undo");
    },
    redo: async () => {
      log.push("redo");
    },
  };
}

describe("useUndoRedo", () => {
  it("starts with canUndo and canRedo both false", () => {
    const { result } = renderHook(() => useUndoRedo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("canUndo is true after pushing a command", () => {
    const { result } = renderHook(() => useUndoRedo());
    const log: string[] = [];

    act(() => result.current.push(makeCommand(log)));

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("calls undo on the last pushed command", async () => {
    const { result } = renderHook(() => useUndoRedo());
    const log: string[] = [];

    act(() => result.current.push(makeCommand(log)));
    await act(() => result.current.undo());

    expect(log).toEqual(["undo"]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("calls redo after an undo", async () => {
    const { result } = renderHook(() => useUndoRedo());
    const log: string[] = [];

    act(() => result.current.push(makeCommand(log)));
    await act(() => result.current.undo());
    await act(() => result.current.redo());

    expect(log).toEqual(["undo", "redo"]);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("pushing after undo clears the redo stack", async () => {
    const { result } = renderHook(() => useUndoRedo());
    const log: string[] = [];

    act(() => result.current.push(makeCommand(log)));
    await act(() => result.current.undo());

    expect(result.current.canRedo).toBe(true);

    act(() => result.current.push(makeCommand(log)));

    expect(result.current.canRedo).toBe(false);
  });

  it("undo on empty stack is a no-op", async () => {
    const { result } = renderHook(() => useUndoRedo());
    await act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
  });

  it("redo on empty stack is a no-op", async () => {
    const { result } = renderHook(() => useUndoRedo());
    await act(() => result.current.redo());
    expect(result.current.canRedo).toBe(false);
  });

  it("clear resets both stacks", async () => {
    const { result } = renderHook(() => useUndoRedo());
    const log: string[] = [];

    act(() => result.current.push(makeCommand(log)));
    await act(() => result.current.undo());
    act(() => result.current.clear());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
