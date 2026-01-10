/**
 * Drawer Handle Component
 *
 * Simple visual indicator for swipe-to-dismiss functionality
 * Follows iOS/Android bottom sheet conventions
 *
 * Features:
 * - Centered horizontal bar
 * - Subtle muted color
 * - Visual affordance for drag gesture
 */

import { calendarDrawerStyles } from "@/lib/styles/calendar-drawer.styles";

/**
 * DrawerHandle - Visual indicator for drawer dismissal
 *
 * Renders a small horizontal bar at the top of the drawer
 * Signals to users that they can swipe down to close
 *
 * @example
 * ```tsx
 * <DrawerHandle />
 * ```
 */
export function DrawerHandle() {
  return <div className={calendarDrawerStyles.drawer.handle} aria-hidden="true" />;
}
