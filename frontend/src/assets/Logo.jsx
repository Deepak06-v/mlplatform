// src/assets/Logo.jsx
// Replace this SVG with your own brand mark if needed.
import React from "react";

export default function Logo({ size = 18, color = "#fff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ← EDIT: swap this path with your own logo SVG path */}
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill={color} opacity="0.7" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill={color} opacity="0.7" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} opacity="0.4" />
    </svg>
  );
}
