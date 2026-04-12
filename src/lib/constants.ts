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
      dashboardCtaLabel: string;
      emptyStateCtaLabel: string;
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
      dashboardCtaLabel: string;
      emptyStateCtaLabel: string;
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
export const WAVE_TOP_PADDING = 0;
export const WAVE_MIN_PX_PER_SEC = 0;
export const WAVE_MAX_PX_PER_SEC = 100;
export const WAVE_BAR_WIDTH = 2;
export const WAVE_BAR_GAP = 4;
export const WAVE_BAR_RADIUS = 9999;
export const WAVE_BAR_COLOR = "#FFFFFF";
export const WAVE_ZOOM_STEP = 10;
export const SEGMENT_GAP_PX = 4;

// Undo / Redo
export const MAX_UNDO_HISTORY = 50;

// Dialog
export type DialogSize = "default" | "wide";

export const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
  default: "min-w-dialog-min-width max-w-dialog-max-width",
  wide: "min-w-[700px] max-w-[800px]",
};

// Keyboard shortcuts
export const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

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
    dashboardCtaLabel: "Upload episode",
    emptyStateCtaLabel: "Upload video",
  },
  ad: {
    kind: "ad",
    title: "Upload Ad",
    description: "Add a new ad video with optional company metadata.",
    endpoint: "/api/ads",
    fileLabel: "Ad video",
    nameLabel: "Ad name",
    companyLabel: "Company name",
    submitLabel: "Upload Ad",
    successLabel: "Ad uploaded",
    dashboardCtaLabel: "Upload Ads",
    emptyStateCtaLabel: "Upload Ad",
  },
} as const satisfies Record<"episode" | "ad", UploadMediaFormCopy>;

export type HlsVariantPreset = {
  name: string;
  width: number;
  height: number;
  bandwidth: number;
  averageBandwidth: number;
  videoBitrate: string;
  maxRate: string;
  bufferSize: string;
  audioBitrate: string;
};

export const HLS_SEGMENT_DURATION_SEC = 6;
export const HLS_NORMALIZED_FRAME_RATE = 30;
export const HLS_AUDIO_SAMPLE_RATE = 48000;
export const HLS_AUDIO_CHANNELS = 2;

export const HLS_VARIANTS: readonly HlsVariantPreset[] = [
  {
    name: "720p",
    width: 1280,
    height: 720,
    bandwidth: 3_500_000,
    averageBandwidth: 2_800_000,
    videoBitrate: "2800k",
    maxRate: "2996k",
    bufferSize: "4200k",
    audioBitrate: "128k",
  },
  {
    name: "540p",
    width: 960,
    height: 540,
    bandwidth: 2_000_000,
    averageBandwidth: 1_600_000,
    videoBitrate: "1600k",
    maxRate: "1712k",
    bufferSize: "2400k",
    audioBitrate: "128k",
  },
  {
    name: "360p",
    width: 640,
    height: 360,
    bandwidth: 1_100_000,
    averageBandwidth: 900_000,
    videoBitrate: "900k",
    maxRate: "963k",
    bufferSize: "1350k",
    audioBitrate: "96k",
  },
  {
    name: "240p",
    width: 426,
    height: 240,
    bandwidth: 550_000,
    averageBandwidth: 450_000,
    videoBitrate: "450k",
    maxRate: "482k",
    bufferSize: "675k",
    audioBitrate: "64k",
  },
] as const;
