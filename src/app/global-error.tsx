"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "./_components/ui/Button";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen bg-background-page text-text-heading">
        <title>Application Error | FlightCast</title>
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 items-center justify-center p-content-p-xs lg:p-page-padding">
          <div className="flex max-w-lg flex-col items-center gap-content-gap-sm rounded-ad-markers border border-border-default bg-surface p-content-p-sm text-center shadow-sm">
            <h1 className="text-2xl font-bold text-text-heading">
              FlightCast hit an unexpected error
            </h1>
            <p className="text-sm text-text-muted">
              {error.message ||
                "Something failed while rendering the application shell."}
            </p>
            <div className="mt-content-gap-sm flex flex-wrap items-center justify-center gap-content-gap-sm">
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
              <Link href="/">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
