import React from "react";

const base =
  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded";

const variants = {
  disabled: "text-gray-500 bg-gray-100",
  loading: "text-indigo-600 bg-indigo-50",
  loaded: "text-emerald-600 bg-emerald-50",
  failed: "text-red-600 bg-red-50"
};

export default function AiBadge({ aiStatus = "disabled", error }) {
  if (aiStatus === "disabled") {
    return <span className={`${base} ${variants.disabled}`}>Static</span>;
  }

  if (aiStatus === "loading") {
    return (
      <span className={`${base} ${variants.loading}`}>
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
        AI thinking...
      </span>
    );
  }

  if (aiStatus === "loaded") {
    return (
      <span className={`${base} ${variants.loaded}`}>✨ AI Generated</span>
    );
  }

  if (aiStatus === "failed") {
    return (
      <span className={`${base} ${variants.failed}`} title={error || ""}>
        ⚠ AI unavailable
      </span>
    );
  }

  return null;
}
