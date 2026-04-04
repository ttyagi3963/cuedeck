import {
  LayoutDashboard,
  BarChart3,
  Target,
  MonitorPlay,
  Download,
  Settings,
  PlayCircle,
  MailPlus,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ROUTES = {
  dashboard: "/dashboard",
  analytics: "/analytics",
  ads: "/",
  channels: "/channels",
  import: "/import",
  settings: "/settings",
  notifications: "/notifications",
  profile: "/profile",
  demo: "/demo",
  invite: "/invite",
  feedback: "/feedback",
  help: "/help",
} as const;

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: ROUTES.dashboard },
  { label: "Analytics", icon: BarChart3, href: ROUTES.analytics },
  { label: "Ads", icon: Target, href: ROUTES.ads },
  { label: "Channels", icon: MonitorPlay, href: ROUTES.channels },
  { label: "Import", icon: Download, href: ROUTES.import },
  { label: "Settings", icon: Settings, href: ROUTES.settings },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Demo mode", icon: PlayCircle, href: ROUTES.demo },
  { label: "Invite your team", icon: MailPlus, href: ROUTES.invite },
  { label: "Give feedback", icon: Lightbulb, href: ROUTES.feedback },
  { label: "Help & support", icon: HelpCircle, href: ROUTES.help },
];
