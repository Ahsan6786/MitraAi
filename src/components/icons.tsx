import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
      <path d="m12.25 12.75-.5-1.5-.5 1.5" />
      <path d="M12.25 15.75a1 1 0 0 0-1.5 0" />
      <path d="M8.5 12.5a1 1 0 0 0-1 1" />
      <path d="M15.5 12.5a1 1 0 0 1 1 1" />
    </svg>
  );
}
