import type { SVGProps } from "react";

export default function MagicWand(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="15" y1="92" x2="60" y2="47" />

      <line x1="68" y1="39" x2="74" y2="33" />

      <line x1="48" y1="18" x2="48" y2="30" />
      <line x1="42" y1="24" x2="54" y2="24" />

      <line x1="78" y1="18" x2="78" y2="30" />
      <line x1="72" y1="24" x2="84" y2="24" />

      <line x1="82" y1="48" x2="82" y2="60" />
      <line x1="76" y1="54" x2="88" y2="54" />
    </svg>
  );
}
