import Link from "next/link";
import Button from "./_components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-content-gap-sm p-content-p-xs lg:p-page-padding">
      <h1 className="text-4xl font-extrabold text-text-heading">404</h1>
      <h2 className="text-xl font-bold text-text-heading">Page not found</h2>
      <p className="text-base text-text-muted text-center max-w-md">
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>
      <Link href="/" className="mt-4">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
