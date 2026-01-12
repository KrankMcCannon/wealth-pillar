/**
 * Swipe Manager Hook
 *
 * Core swipe gesture logic with Apple-inspired physics and interactions.
 * Handles drag detection, velocity calculations, and global state coordination.
 *
 * @module hooks/use-swipe-manager
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, animate, type PanInfo, type MotionValue } from "framer-motion";
import { useSwipeStateStore } from "@/stores/swipe-state-store";
import { appleSwipeTokens } from "@/components/ui/interactions/theme/swipe-styles";

// ============================================================================
// Types
// ============================================================================

export type SwipeSide = "left" | "right" | null;

export interface UseSwipeManagerProps {
  /** Unique card ID for global state tracking */
  cardId: string;

  /** Which swipe directions are enabled */
  directions: "left" | "right" | "both";

  /** Disable swipe interactions */
  disabled?: boolean;
}

export interface UseSwipeManagerReturn {
  // Motion state
  x: MotionValue<number>;

  // Swipe state
  isOpen: boolean;
  swipeSide: SwipeSide;

  // Gesture handlers
  dragHandlers: {
    onDragStart: () => void;
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
    onTap: () => boolean;
  };

  // Control methods
  closeSwipe: () => void;

  // Drag constraints
  dragConstraints: { left: number; right: number };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Swipe Manager Hook
 *
 * Manages swipe gesture state and animations with Apple-style physics.
 *
 * Key Features:
 * - Global coordination (auto-closes other cards)
 * - Velocity-based detection (fast swipe = instant trigger)
 * - Hysteresis thresholds (different for open vs. close)
 * - Tap vs. drag distinction (prevents accidental modal opens)
 * - Spring animations with iOS-calibrated physics
 *
 * @param props - Configuration options
 * @returns Swipe state and handlers
 */
export function useSwipeManager({
  cardId,
  directions,
  disabled = false,
}: UseSwipeManagerProps): UseSwipeManagerReturn {
  // Use direct store access with stable selector
  const setOpenCard = useSwipeStateStore((state) => state.setOpenCard);
  const isOpen = useSwipeStateStore((state) => state.openCardId === cardId);

  const hasDragged = useRef(false);
  const swipeSideRef = useRef<SwipeSide>(null);
  const [swipeSide, setSwipeSide] = useState<SwipeSide>(null);
  const x = useMotionValue(0);

  const { physics, thresholds, dimensions } = appleSwipeTokens;
  const actionWidth = dimensions.actionWidthSingle;

  // Calculate drag constraints based on enabled action sides
  // Right action = drag left (negative), Left action = drag right (positive)
  const dragConstraints = {
    left: directions === "right" || directions === "both" ? -actionWidth : 0,
    right: directions === "left" || directions === "both" ? actionWidth : 0,
  };

  const updateSwipeSide = (nextSide: SwipeSide) => {
    swipeSideRef.current = nextSide;
    setSwipeSide(nextSide);
  };

  // ============================================================================
  // Animation Sync
  // ============================================================================

  /**
   * Sync Framer Motion x value with global swipe state
   * Uses spring animation for smooth, natural motion
   *
   * CRITICAL: We NEVER call setState here to prevent infinite loops.
   * swipeSide state is only updated in drag handlers.
   */
  useEffect(() => {
    if (disabled) return;

    // Determine target X position based on isOpen and current swipeSide
    let targetX = 0;

    if (isOpen && swipeSideRef.current) {
      // Use the swipeSide that was set by drag handlers
      if (swipeSideRef.current === "left") {
        targetX = actionWidth;
      } else {
        targetX = -actionWidth;
      }
    } else if (!isOpen) {
      // Card is closing: clear ref only; state is synced below
      swipeSideRef.current = null;
    }

    // Animate to target position
    const currentX = x.get();
    if (Math.abs(currentX - targetX) > 0.5) {
      animate(x, targetX, {
        type: "spring",
        stiffness: physics.spring.stiffness,
        damping: physics.spring.damping,
        mass: physics.spring.mass,
      });
    }
  }, [isOpen, actionWidth, physics.spring.stiffness, physics.spring.damping, physics.spring.mass, disabled, x]);

  useEffect(() => {
    if (!isOpen && swipeSideRef.current !== null) {
      swipeSideRef.current = null;
    }
  }, [isOpen]);

  // ============================================================================
  // Gesture Handlers
  // ============================================================================

  /**
   * Handle drag start
   * Initializes drag tracking to distinguish from taps
   */
  const handleDragStart = () => {
    if (disabled) return;
    hasDragged.current = false;
  };

  /**
   * Handle drag end
   * Core swipe detection logic with velocity and distance thresholds
   *
   * Apple UX patterns:
   * - Fast swipe (high velocity) = instant trigger
   * - Slow drag requires crossing threshold
   * - Hysteresis: Different thresholds for open vs. close
   * - Auto-close if dragging back toward center beyond 70%
   */
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (disabled) return;

    const currentX = x.get();
    const velocityX = info.velocity.x;
    const dragDistance = Math.abs(info.offset.x);

    // Mark as dragged if movement > 10px (not a tap)
    if (dragDistance > 10) {
      hasDragged.current = true;
    }

    // ========================================
    // Case 1: Card is currently OPEN
    // ========================================
    if (isOpen) {
      const currentSide = swipeSideRef.current;
      if (currentSide === "right") {
        // Right swipe open (delete action)
        // Close if dragging right > 30% OR positive velocity > 10
        const shouldClose = currentX > -actionWidth * 0.7 || velocityX > 10;
        if (shouldClose) {
          updateSwipeSide(null);
          setOpenCard(null);
        }
      } else if (currentSide === "left") {
        // Left swipe open (pause/resume action)
        // Close if dragging left > 30% OR negative velocity < -10
        const shouldClose = currentX < actionWidth * 0.7 || velocityX < -10;
        if (shouldClose) {
          updateSwipeSide(null);
          setOpenCard(null);
        }
      }
    }
    // ========================================
    // Case 2: Card is currently CLOSED
    // ========================================
    else {
      // Check for right swipe (delete)
      if (
        (directions === "right" || directions === "both") &&
        (currentX < -thresholds.open || velocityX < thresholds.velocity)
      ) {
        updateSwipeSide("right");
        setOpenCard(cardId);
      }
      // Check for left swipe (pause/resume)
      else if (
        (directions === "left" || directions === "both") &&
        (currentX > thresholds.open || velocityX > Math.abs(thresholds.velocity))
      ) {
        updateSwipeSide("left");
        setOpenCard(cardId);
      }
      // Neither threshold met: snap back to closed
      else {
        updateSwipeSide(null);
        setOpenCard(null);
      }
    }

    // Reset drag flag after delay (allows handleTap to read it)
    setTimeout(() => {
      hasDragged.current = false;
    }, 100);
  };

  /**
   * Handle tap
   * Distinguishes intentional taps from accidental swipe releases
   *
   * Behavior:
   * - If just dragged: Ignore (prevent modal open during swipe)
   * - If card is open: Close swipe, then trigger callback after delay
   * - If card is closed: Trigger callback immediately
   */
  const handleTap = (): boolean => {
    if (disabled) return false;

    // Ignore tap if user just finished dragging
    if (hasDragged.current) {
      hasDragged.current = false;
      return false;
    }

    const currentX = x.get();

    // If card is open or partially open
    if (isOpen || Math.abs(currentX) > thresholds.tap) {
      // Close the swipe
      setOpenCard(null);
      // Note: onCardClick callback handled by SwipeableCard component
      return false;
    }

    // Card is closed: onCardClick handled by SwipeableCard
    return true;
  };

  /**
   * Programmatically close swipe
   * Useful for action handlers that need to close after execution
   */
  const closeSwipe = () => {
    updateSwipeSide(null);
    setOpenCard(null);
  };

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Motion state
    x,

    // Swipe state
    isOpen,
    swipeSide: isOpen ? swipeSide : null,

    // Gesture handlers
    dragHandlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onTap: handleTap,
    },

    // Control methods
    closeSwipe,

    // Drag constraints
    dragConstraints,
  };
}
