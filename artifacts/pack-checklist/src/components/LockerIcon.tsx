import React from 'react';

interface LockerIconProps {
  className?: string;
}

/**
 * Bold padlock / locker icon — SVG replacement for locker-icon.png.
 * Uses currentColor so it follows the parent element's text color.
 * stroke-width 3 gives it a visual weight that matches bold headings.
 */
export function LockerIcon({ className }: LockerIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Shackle (U-shaped arc) */}
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      {/* Body */}
      <rect x="4" y="11" width="16" height="11" rx="2" />
    </svg>
  );
}
