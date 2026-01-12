/**
 * Swipe Interaction Styles - Apple Design System
 *
 * iOS-inspired swipe gesture physics, animations, and visual feedback.
 * Based on Apple's Human Interface Guidelines for gestures and transitions.
 *
 * @module components/ui/interactions/theme/swipe-styles
 */

import type { CSSProperties } from "react";

// ============================================================================
// Apple Design Tokens
// ============================================================================

/**
 * Physics constants inspired by iOS swipe interactions
 * Values derived from iOS Mail, Reminders, and Messages apps
 */
export const appleSwipeTokens = {
  /**
   * Spring animation physics (iOS-style)
   * - Tighter springs than standard web defaults
   * - More damping for smooth, controlled motion
   * - Lighter mass for snappier feel
   */
  physics: {
    spring: {
      stiffness: 520,      // Snappier response to align swipe timing across cards
      damping: 36,         // Balanced damping to avoid overshoot
      mass: 0.7,           // Slightly lighter for quicker settle
    },
    drag: {
      elastic: 0.15,       // Less elastic than current (0.2) for tighter control
      resistance: 0.6,     // Resistance when dragging beyond limits
    },
  },

  /**
   * Gesture thresholds (iOS-calibrated)
   * - Hysteresis: Different thresholds for opening vs. closing
   * - Velocity-based: Fast swipes trigger instantly
   */
  thresholds: {
    open: 60,              // Slightly higher than current (50px) - deliberate action
    close: 40,             // Lower threshold for closing (hysteresis pattern)
    velocity: -300,        // More aggressive velocity threshold than current (-200)
    tap: 5,                // Maximum movement to count as tap (not swipe)
  },

  /**
   * Action button dimensions (iOS standards)
   * - 88px: iOS minimum touch target size
   * - 176px: For two actions side-by-side
   */
  dimensions: {
    actionWidthSingle: 88,    // Single action button width
    actionWidthDouble: 176,   // Two actions side-by-side
    maxSwipe: 200,            // Maximum swipe distance
  },

  /**
   * Animation durations and easing (iOS timing)
   */
  animations: {
    duration: {
      fast: 250,           // Quick interactions (tap feedback)
      normal: 300,         // Standard transitions (swipe open/close)
      slow: 350,           // Deliberate animations (modal transitions)
    },
    easing: {
      spring: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', // Bounce effect
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // Ease-out
      sharp: 'cubic-bezier(0.4, 0.0, 0.2, 1)',         // Deceleration
    },
  },
};

// ============================================================================
// Tailwind Class Registry
// ============================================================================

/**
 * Swipeable card styles following Apple's visual language
 */
export const swipeStyles = {
  /**
   * Wrapper container
   * - Isolates swipe layers with proper z-index stacking
   * - Enables GPU acceleration with transform
   */
  wrapper: "relative w-full overflow-hidden touch-pan-y isolate",

  /**
   * Global backdrop (semi-transparent overlay)
   * - iOS-style subtle darkening
   * - Positioned above swipe layers, below modals
   */
  backdrop: {
    base: "fixed inset-0 transition-opacity duration-200",
    visible: "opacity-100",
    hidden: "opacity-0 pointer-events-none",
    zIndex: 10, // Between cards (z-10) and modals (z-50)
  },

  /**
   * Action layers (left and right swipe actions)
   */
  actionLayer: {
    base: "absolute inset-y-0 z-0 flex items-center",
    left: "left-0 justify-start",
    right: "right-0 justify-end",
  },

  /**
   * Action buttons (delete, pause, resume)
   */
  actionButton: {
    base: "h-full font-medium flex items-center justify-center transition-all duration-200 ease-out px-6",

    // Variants based on action type
    variants: {
      delete: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
      pause: "bg-warning text-white hover:bg-warning/90 active:bg-warning/80",
      resume: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
      custom: "bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30",
    },

    // Scale animation states
    scale: {
      enter: "scale-85 opacity-0",      // Initial state
      visible: "scale-100 opacity-100",  // Fully visible
      exit: "scale-85 opacity-0",        // Exit state
    },
  },

  /**
   * Card content wrapper (foreground)
   * - Elevated above action layers
   * - Hardware-accelerated transforms
   */
  cardContent: {
    base: "relative z-10 will-change-transform backface-hidden",

    // Shadow elevation states
    shadow: {
      closed: "shadow-none",
      opening: "shadow-md",
      open: "shadow-lg",
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate dynamic action layer styles based on swipe state
 * Handles width, opacity, and transform animations
 *
 * @param isOpen - Whether the action layer is currently visible
 * @param side - Which side the action is on (left or right)
 * @param actionWidth - Width of the action button (default: 88px)
 * @returns CSS properties object
 */
export function getActionLayerStyle(
  isOpen: boolean,
  side: "left" | "right",
  actionWidth: number = appleSwipeTokens.dimensions.actionWidthSingle
): CSSProperties {
  return {
    width: isOpen ? `${actionWidth}px` : "0px",
    opacity: isOpen ? 1 : 0,
    // Slide in from offset position (Apple effect)
    transform: isOpen
      ? "translateX(0)"
      : side === "left"
        ? "translateX(-12px)"
        : "translateX(12px)",
    transition: `width ${appleSwipeTokens.animations.duration.normal}ms ${appleSwipeTokens.animations.easing.smooth},
                 opacity ${appleSwipeTokens.animations.duration.fast}ms ${appleSwipeTokens.animations.easing.smooth},
                 transform ${appleSwipeTokens.animations.duration.normal}ms ${appleSwipeTokens.animations.easing.smooth}`,
  };
}

/**
 * Generate action button scale animation styles
 * Creates the "pop-in" effect as the button appears
 *
 * @param isVisible - Whether the button should be visible
 * @returns CSS properties object
 */
export function getActionButtonStyle(isVisible: boolean): CSSProperties {
  return {
    transform: isVisible ? "scale(1)" : "scale(0.85)",
    opacity: isVisible ? 1 : 0,
    transition: `transform ${appleSwipeTokens.animations.duration.normal}ms ${appleSwipeTokens.animations.easing.spring},
                 opacity ${appleSwipeTokens.animations.duration.fast}ms ${appleSwipeTokens.animations.easing.smooth}`,
  };
}

/**
 * Generate card shadow elevation style based on swipe state
 * Provides depth perception as card lifts during swipe
 *
 * @param isOpen - Whether the swipe is currently open
 * @returns CSS class string
 */
export function getCardShadowClass(isOpen: boolean): string {
  return isOpen ? swipeStyles.cardContent.shadow.open : swipeStyles.cardContent.shadow.closed;
}

/**
 * Calculate rubber-band resistance for drag beyond constraints
 * Implements iOS-style exponential resistance
 *
 * @param distance - Distance dragged beyond constraint
 * @param maxDistance - Maximum allowed distance
 * @returns Adjusted resistance value (0-1)
 */
export function calculateRubberBandResistance(
  distance: number,
  maxDistance: number
): number {
  const { resistance } = appleSwipeTokens.physics.drag;
  // Exponential falloff: resistance decreases as distance increases
  return resistance * (1 - Math.pow(Math.abs(distance) / maxDistance, 2));
}

/**
 * Type guard for swipe action variants
 */
export type SwipeActionVariant = keyof typeof swipeStyles.actionButton.variants;

/**
 * Get action button classes for a specific variant
 *
 * @param variant - Action variant type
 * @returns Combined CSS class string
 */
export function getActionButtonClasses(variant: SwipeActionVariant): string {
  return `${swipeStyles.actionButton.base} ${swipeStyles.actionButton.variants[variant]}`;
}
