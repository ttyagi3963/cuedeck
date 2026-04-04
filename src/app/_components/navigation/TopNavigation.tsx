import { Settings, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import Logo from "../ui/Logo";

export default function TopNavigation() {
  return (
    <nav className="border-b border-border-default bg-surface">
      <div className="flex h-nav-height items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        <div className="flex items-center gap-6">
          <Link
            href={ROUTES.settings}
            aria-label="Settings"
            className="text-text-muted transition-colors hover:text-text-heading"
          >
            <Settings className="h-5 w-5" />
          </Link>

          <Link
            href={ROUTES.notifications}
            aria-label="Notifications"
            className="relative text-text-muted transition-colors hover:text-text-heading"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 -right-0.5 h-2 w-2 rounded-full bg-notification-badge" />
          </Link>

          <Link
            href={ROUTES.profile}
            className="flex items-center gap-3 rounded-md border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading transition-colors hover:bg-background-page"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-border-default">
              E
            </span>
            <span>Emma Warren</span>
            <ChevronDown className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
