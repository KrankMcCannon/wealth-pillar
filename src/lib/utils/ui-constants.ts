/**
 * Shared UI Constants
 * Centralized location for commonly used UI values across components
 */

/** Shimmer animation for loading skeletons */
export const SHIMMER_BASE =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full ' +
  'before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r ' +
  'before:from-transparent before:via-primary/15 before:to-transparent';

/** Base classes for sticky headers */
export const STICKY_HEADER_BASE =
  'fixed top-0 left-0 right-0 md:left-64 backdrop-blur-xl border-b border-primary/20 shadow-sm bg-card/80';
