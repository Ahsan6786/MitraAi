
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

export function LogoPart1(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M4 18.5V9.5C4 7 5 5 8 5c3 0 4 2 4 4.5v9" />
        </svg>
    );
}

export function LogoPart2(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 18.5V9.5c0-2.5 1-4.5 4-4.5s4 2 4 4.5v9" />
        </svg>
    );
}

export function LogoPart3(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M10 12h4" />
        </svg>
    );
}

export function LotusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12 2c-3 0-5 3-5 5 0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4 0-2-2-5-5-5z" />
        <path d="M12 11c-3.5 0-6.5 3-6.5 6.5S8.5 24 12 24s6.5-3 6.5-6.5S15.5 11 12 11z" />
        <path d="M2 12h1.5a4.5 4.5 0 0 1 4.5 4.5V17" />
        <path d="M22 12h-1.5a4.5 4.5 0 0 0-4.5 4.5V17" />
    </svg>
  );
}
