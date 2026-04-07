import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
}
