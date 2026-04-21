import type { SVGProps } from "react";

export default function VolumeOn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.6 4.2 8 10H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4l7.6 5.8c.7.5 1.7 0 1.7-.8V5c0-.8-1-1.3-1.7-.8Z"
        fill="currentColor"
      />
      <path
        d="M22 11a6 6 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M25.5 7.5a11 11 0 0 1 0 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
