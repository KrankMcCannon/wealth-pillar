/**
 * Shared UI Constants
 * Centralized location for commonly used UI values across components
 */

/** Shimmer animation for loading skeletons */
export const SHIMMER_BASE =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full " +
  "before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r " +
  "before:from-transparent before:via-white/60 before:to-transparent";

/** Base classes for sticky headers */
export const STICKY_HEADER_BASE =
  "sticky top-0 backdrop-blur-xl border-b shadow-sm";
