import React from "react";

interface CS2LogoProps {
  className?: string;
  color?: string;
}

/**
 * CS2 crosshair/target logo SVG component.
 * Used as a watermark fallback when a team logo is not available.
 */
export const CS2Logo: React.FC<CS2LogoProps> = ({
  className = "",
  color = "currentColor",
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle */}
    <circle
      cx="50"
      cy="50"
      r="44"
      stroke={color}
      strokeWidth="3"
      fill="none"
    />
    {/* Inner circle */}
    <circle
      cx="50"
      cy="50"
      r="20"
      stroke={color}
      strokeWidth="2.5"
      fill="none"
    />
    {/* Crosshair lines */}
    {/* Top */}
    <line x1="50" y1="2" x2="50" y2="28" stroke={color} strokeWidth="3" />
    {/* Bottom */}
    <line x1="50" y1="72" x2="50" y2="98" stroke={color} strokeWidth="3" />
    {/* Left */}
    <line x1="2" y1="50" x2="28" y2="50" stroke={color} strokeWidth="3" />
    {/* Right */}
    <line x1="72" y1="50" x2="98" y2="50" stroke={color} strokeWidth="3" />
    {/* Center dot */}
    <circle cx="50" cy="50" r="3" fill={color} />
  </svg>
);
