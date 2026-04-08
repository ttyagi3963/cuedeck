"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "./_components/ui/Button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-content-gap-sm p-content-p-xs lg:p-page-padding">
      <h1 className="text-2xl font-bold text-text-heading">
        Something went wrong
      </h1>
      <p className="max-w-md text-center text-sm text-text-muted">
        {error.message ||
          "An unexpected error occurred while loading this page."}
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
  );
}
