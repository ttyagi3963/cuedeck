import type { SVGProps } from "react";

export default function NavChannel(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.1667 1.66667L10.0001 5.83333L5.83341 1.66667M3.33341 5.83333H16.6667C17.5872 5.83333 18.3334 6.57952 18.3334 7.5V16.6667C18.3334 17.5871 17.5872 18.3333 16.6667 18.3333H3.33341C2.41294 18.3333 1.66675 17.5871 1.66675 16.6667V7.5C1.66675 6.57952 2.41294 5.83333 3.33341 5.83333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
