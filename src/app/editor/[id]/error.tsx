"use client";

import Button from "@/app/_components/ui/Button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EditorError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-16">
      <h1 className="text-2xl font-bold text-text-heading">
        Something went wrong
      </h1>
      <p className="text-sm text-text-muted">
        {error.message ||
          "An unexpected error occurred while loading the editor."}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
