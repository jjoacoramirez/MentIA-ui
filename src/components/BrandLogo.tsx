import React from "react";
export const BrandLogo: React.FC<{
  className?: string;
  size?: "sm" | "md" | "lg";
}> = ({ className = "", size = "md" }) => (
  <svg
    role="img"
    aria-label="MentIA"
    viewBox="0 0 100 100"
    className={`${{ sm: "w-7 h-7", md: "w-9 h-9", lg: "w-24 h-24" }[size]} ${className}`}
  >
    <circle cx="50" cy="50" r="48" fill="#6366f1" />
    <path
      d="M30 32 L70 32 L50 74 Z"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinejoin="round"
    />
    <circle cx="30" cy="32" r="9" fill="white" />
    <circle cx="70" cy="32" r="9" fill="#a5b4fc" />
    <circle cx="50" cy="74" r="9" fill="#22d3ee" />
  </svg>
);
