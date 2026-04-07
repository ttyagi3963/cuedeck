import type { SVGProps } from "react";

export default function Redo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18.66 4.468h-2v2.557a7 7 0 1 0 1.037 10.011l-1.619-1.185a5 5 0 1 1-.826-7.384H12.66v2h6v-6z"
        fill="currentColor"
      />
    </svg>
  );
}
