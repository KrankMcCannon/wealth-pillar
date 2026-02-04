'use client';

import { useSyncExternalStore } from 'react';

/**
 * Custom hook for responsive design using media queries
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 768px)");
 * const isMobile = useMediaQuery("(max-width: 767px)");
 */
export function useMediaQuery(query: string): boolean {
  const getSnapshot = () =>
    globalThis.window === undefined ? false : globalThis.window.matchMedia(query).matches;

  const subscribe = (callback: () => void) => {
    const mediaQuery = globalThis.window.matchMedia(query);
    const handleChange = () => callback();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
