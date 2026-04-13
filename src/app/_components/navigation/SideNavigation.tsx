"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import Link from "next/link";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import UploadMediaForm from "../upload/UploadMediaForm";
import { PRIMARY_NAV_ITEMS, UPLOAD_MEDIA_FORM_COPY } from "@/lib/constants";
import { useLayout } from "@/context/LayoutContext";
import WeeklyPlaysCard from "./partials/WeeklyPlaysCard";
import MiniSidebar from "./partials/MiniSidebar";

export default function SideNavigation() {
  const pathname = usePathname();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const episodeUploadCopy = UPLOAD_MEDIA_FORM_COPY.episode;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-5 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-button-primary border border-border-default bg-surface text-text-heading shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width)] transform transition-transform duration-300 ease-out bg-surface border-r border-border-default
          lg:relative lg:translate-x-0 lg:transition-none lg:z-auto lg:block lg:w-full
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div
          className={`flex h-full flex-col justify-between overflow-y-auto py-8 transition-[padding] duration-300 ${
            isSidebarCollapsed ? "lg:px-2" : "px-8"
          }`}
        >
          <div>
            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex mb-4 h-10 w-10 items-center justify-center rounded-button-primary text-text-muted transition-colors hover:bg-background-hover hover:text-text-heading"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>

            {/* Create episode button */}
            {isSidebarCollapsed ? (
              <div className="mb-6 hidden lg:block">
                <Button
                  variant="primary"
                  className="w-full !px-0 justify-center"
                  title="Create an episode"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="mb-6 w-full"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                Create an episode
              </Button>
            )}

            {/* Show full button on mobile even when desktop is collapsed */}
            {isSidebarCollapsed && (
              <Button
                variant="primary"
                className="mb-6 w-full lg:hidden"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                Create an episode
              </Button>
            )}

            <Dialog
              open={isUploadDialogOpen}
              onClose={() => setIsUploadDialogOpen(false)}
              title={episodeUploadCopy.title}
              subtitle={episodeUploadCopy.description}
            >
              <UploadMediaForm
                kind="episode"
                showHeader={false}
                onSuccess={() => setIsUploadDialogOpen(false)}
              />
            </Dialog>

            {/* Podcast selector — hidden when collapsed */}
            {!isSidebarCollapsed && (
              <Button
                variant="outline"
                className="mb-8 flex w-full items-center justify-between gap-content-gap-md rounded-dialog px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button-primary bg-background-primary text-sm text-text-on-primary">
                  P
                </span>
                <span className="truncate text-base font-bold text-text-heading">
                  The Diary Of A CEO
                </span>
                <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-text-muted" />
              </Button>
            )}

            {/* Primary navigation */}
            <nav aria-label="Primary navigation">
              <ul className="grid gap-content-gap-xxs">
                {PRIMARY_NAV_ITEMS.map(({ label, icon: Icon, href }) => {
                  const isActive =
                    href === "/"
                      ? pathname === "/"
                      : href === "/ads"
                        ? pathname.startsWith("/ads") ||
                          pathname.startsWith("/editor")
                        : pathname.startsWith(href);

                  return (
                    <li key={label}>
                      <Link
                        href={href}
                        onClick={() => setIsOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        title={isSidebarCollapsed ? label : undefined}
                        className={[
                          "flex h-12 items-center gap-content-gap-md rounded-button-primary text-lg font-bold transition-colors",
                          isSidebarCollapsed
                            ? "lg:justify-center lg:px-0 px-3 w-full"
                            : "px-3 w-full",
                          isActive
                            ? "bg-background-hover text-text-heading"
                            : "text-text-muted hover:bg-background-page hover:text-text-heading",
                        ].join(" ")}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={isSidebarCollapsed ? "lg:hidden" : ""}>
                          {label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Weekly plays — hidden when collapsed */}
          {!isSidebarCollapsed && <WeeklyPlaysCard />}

          <div>
            <MiniSidebar isCollapsed={isSidebarCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
