import {
  NavDashboard,
  NavAnalytics,
  NavAds,
  NavChannel,
  NavImport,
} from "@/app/_components/ui/icons";
import { Settings, MailPlus, Lightbulb, HelpCircle } from "lucide-react";

import type { NavItem } from "@/contracts/navigation";

type UploadMediaFormCopy =
  | {
      kind: "episode";
      title: string;
      description: string;
      endpoint: "/api/episodes";
      fileLabel: string;
      nameLabel: string;
      submitLabel: string;
      successLabel: string;
    }
  | {
      kind: "ad";
      title: string;
      description: string;
      endpoint: "/api/ads";
      fileLabel: string;
      nameLabel: string;
      companyLabel: string;
      submitLabel: string;
      successLabel: string;
    };

export const ROUTES = {
  dashboard: "/",
  analytics: "/analytics",
  ads: "/ads",
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

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: NavDashboard, href: ROUTES.dashboard },
  { label: "Analytics", icon: NavAnalytics, href: ROUTES.analytics },
  { label: "Ads", icon: NavAds, href: ROUTES.ads },
  { label: "Channels", icon: NavChannel, href: ROUTES.channels },
  { label: "Import", icon: NavImport, href: ROUTES.import },
  { label: "Settings", icon: Settings, href: ROUTES.settings },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Invite your team", icon: MailPlus, href: ROUTES.invite },
  { label: "Give feedback", icon: Lightbulb, href: ROUTES.feedback },
  { label: "Help & support", icon: HelpCircle, href: ROUTES.help },
];

// Waveform
export const WAVE_HEIGHT = 132;
export const WAVE_TOP_PADDING = 22;
export const WAVE_MIN_PX_PER_SEC = 0;
export const WAVE_MAX_PX_PER_SEC = 100;
export const WAVE_BAR_WIDTH = 2;
export const WAVE_BAR_GAP = 4;
export const WAVE_BAR_RADIUS = 9999;
export const WAVE_BAR_COLOR = "#FFFFFF";

export const UPLOAD_MEDIA_FORM_COPY = {
  episode: {
    kind: "episode",
    title: "Upload Episode",
    description: "Add a new podcast episode video to the editor.",
    endpoint: "/api/episodes",
    fileLabel: "Episode video",
    nameLabel: "Episode name",
    submitLabel: "Upload episode",
    successLabel: "Episode uploaded",
  },
  ad: {
    kind: "ad",
    title: "Upload Ad",
    description: "Add a new ad video with optional company metadata.",
    endpoint: "/api/ads",
    fileLabel: "Ad video",
    nameLabel: "Ad name",
    companyLabel: "Company name",
    submitLabel: "Upload ad",
    successLabel: "Ad uploaded",
  },
} as const satisfies Record<"episode" | "ad", UploadMediaFormCopy>;
