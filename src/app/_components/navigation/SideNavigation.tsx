import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Button from "../ui/Button";
import { PRIMARY_NAV_ITEMS } from "@/lib/constants";
import WeeklyPlaysCard from "./partials/WeeklyPlaysCard";
import MiniSidebar from "./partials/MiniSidebar";

const activeItem = "Ads";

export default function SideNavigation() {
  return (
    <aside className="border-r border-border-default bg-surface">
      <div className="flex h-full flex-col justify-between px-8 py-8">
        <div>
          <Button variant="primary" className="mb-6 w-full">
            Create an episode
          </Button>

          <Button
            variant="outline"
            className="mb-8 flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-primary text-sm text-text-on-primary">
              P
            </span>
            <span className="truncate text-base font-bold text-text-heading">
              The Diary Of A CEO
            </span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-text-muted" />
          </Button>

          <nav aria-label="Primary navigation">
            <ul className="grid gap-1">
              {PRIMARY_NAV_ITEMS.map(({ label, icon: Icon, href }) => {
                const isActive = label === activeItem;

                return (
                  <li key={label}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "flex h-12 w-full items-center gap-3 rounded-md px-3 text-lg font-bold transition-colors",
                        isActive
                          ? "bg-background-page text-text-heading"
                          : "text-text-muted hover:bg-background-page hover:text-text-heading",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <WeeklyPlaysCard />

        <div>
          <MiniSidebar />
        </div>
      </div>
    </aside>
  );
}
