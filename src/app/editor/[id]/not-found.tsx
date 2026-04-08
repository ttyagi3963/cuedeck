import Link from "next/link";

export default function EditorNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-content-gap-sm p-16">
      <h1 className="text-2xl font-bold text-text-heading">
        Episode not found
      </h1>
      <p className="text-sm text-text-muted">
        The episode you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-interactive-primary hover:underline"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
