import { Settings, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import Logo from "../ui/Logo";

export default function TopNavigation() {
  return (
    <nav className="border-b border-border-default bg-surface">
      <div className="flex h-nav-height items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-content-gap-md ml-12 lg:ml-0">
          <Logo />
        </div>

        <div className="flex items-center gap-content-gap-sm lg:gap-dialog-gap">
          <Link
            href={ROUTES.settings}
            aria-label="Settings"
            className="text-text-muted transition-colors hover:text-text-heading hidden sm:block"
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
            className="flex items-center gap-content-gap-md rounded-button-primary border border-border-default bg-surface px-3 py-2 lg:px-4 text-sm lg:text-base font-semibold text-text-heading transition-colors hover:bg-background-page"
          >
            <span className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-full bg-border-default">
              E
            </span>
            <span className="hidden sm:block">Emma Warren</span>
            <ChevronDown className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
