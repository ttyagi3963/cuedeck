import { PlayCircle } from "lucide-react";
import { SECONDARY_NAV_ITEMS } from "@/lib/constants";

type MiniSidebarProps = {
  isCollapsed: boolean;
};

export default function MiniSidebar({ isCollapsed }: MiniSidebarProps) {
  return (
    <div className="space-y-3">
      {/* Demo mode toggle — hidden when collapsed */}
      {!isCollapsed && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="flex items-center gap-content-gap-md text-base font-bold text-text-muted">
            <PlayCircle className="h-5 w-5" />
            Demo mode
          </span>
          <span
            role="switch"
            aria-checked="false"
            aria-label="Toggle demo mode"
            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border-default bg-background-page transition-colors"
          >
            <span className="inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-text-muted transition-transform" />
          </span>
        </div>
      )}

      {SECONDARY_NAV_ITEMS.map(({ label, icon: Icon }) => (
        <button
          type="button"
          key={label}
          title={isCollapsed ? label : undefined}
          className={[
            "flex w-full items-center gap-content-gap-md py-1.5 text-base font-bold text-text-muted transition-colors hover:text-text-heading",
            isCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3",
          ].join(" ")}
          aria-disabled="true"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className={isCollapsed ? "lg:hidden" : ""}>{label}</span>
        </button>
      ))}
    </div>
  );
}
