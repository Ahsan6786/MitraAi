import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 9H4v3h4v2H4v3h4" />
      <path d="M16 9h4v3h-4v2h4v3h-4" />
      <path d="M12 9V5" />
      <path d="M12 17v2" />
    </svg>
  );
}
