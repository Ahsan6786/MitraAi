import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 18.5V9.5C4 7 5 5 8 5c3 0 4 2 4 4.5v9" />
      <path d="M12 18.5V9.5c0-2.5 1-4.5 4-4.5s4 2 4 4.5v9" />
      <path d="M10 12h4" />
    </svg>
  );
}
