/**
 * Swipe Manager Hook
 *
 * Core swipe gesture logic with Apple-inspired physics and interactions.
 * Handles drag detection, velocity calculations, and global state coordination.
 *
 * @module hooks/use-swipe-manager
 */

'use client';
'use no memo';

import { useEffect, useRef, useState } from 'react';
import { useMotionValue, animate, type PanInfo, type MotionValue } from 'framer-motion';
import { useSwipeStateStore } from '@/stores/swipe-state-store';
import { appleSwipeTokens } from '@/components/ui/interactions/theme/swipe-styles';

// ============================================================================
// Types
// ============================================================================

export type SwipeSide = 'left' | 'right' | null;

interface PointerStart {
  x: number;
  y: number;
  time: number;
}

export interface UseSwipeManagerProps {
  /** Unique card ID for global state tracking */
  cardId: string;

  /** Which swipe directions are enabled */
  directions: 'left' | 'right' | 'both';

  /** Disable swipe interactions */
  disabled?: boolean;
}

export interface UseSwipeManagerReturn {
  x: MotionValue<number>;
  isOpen: boolean;
  swipeSide: SwipeSide;

  dragHandlers: {
    onDragStart: () => void;
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => boolean;
  };

  closeSwipe: () => void;
  dragConstraints: { left: number; right: number };
}

// ============================================================================
// Constants
// ============================================================================

const TAP_MAX_DISTANCE = 10;
const TAP_MAX_DURATION = 300;
const DRAG_THRESHOLD = 10;

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
 * - Pointer-based tap detection (reliable with drag)
 * - Spring animations with iOS-calibrated physics
 */
export function useSwipeManager({
  cardId,
  directions,
  disabled = false,
}: UseSwipeManagerProps): UseSwipeManagerReturn {
  const setOpenCard = useSwipeStateStore((state) => state.setOpenCard);
  const isOpen = useSwipeStateStore((state) => state.openCardId === cardId);

  const hasDragged = useRef(false);
  const pointerStartRef = useRef<PointerStart | null>(null);

  // swipeSide is state (not a ref) so it is safe to read during render.
  // It is only updated inside event handlers, never inside effects.
  const [swipeSide, setSwipeSide] = useState<SwipeSide>(null);
  const x = useMotionValue(0);

  const { physics, thresholds, dimensions } = appleSwipeTokens;
  const actionWidth = dimensions.actionWidthSingle;

  const dragConstraints = {
    left: directions === 'right' || directions === 'both' ? -actionWidth : 0,
    right: directions === 'left' || directions === 'both' ? actionWidth : 0,
  };

  // ============================================================================
  // Animation Sync
  // ============================================================================

  /**
   * Sync Framer Motion x value with global swipe state.
   * swipeSide is a dependency so the effect re-runs when it changes.
   * setState is never called here — only the external (Framer Motion) system is updated.
   */
  useEffect(() => {
    if (disabled) return;

    let targetX = 0;
    if (isOpen && swipeSide) {
      targetX = swipeSide === 'left' ? actionWidth : -actionWidth;
    }

    const currentX = x.get();
    if (Math.abs(currentX - targetX) > 0.5) {
      animate(x, targetX, {
        type: 'spring',
        stiffness: physics.spring.stiffness,
        damping: physics.spring.damping,
        mass: physics.spring.mass,
      });
    }
  }, [
    isOpen,
    swipeSide,
    actionWidth,
    physics.spring.stiffness,
    physics.spring.damping,
    physics.spring.mass,
    disabled,
    x,
  ]);

  // ============================================================================
  // Gesture Handlers
  // ============================================================================

  const handleDragStart = () => {
    if (disabled) return;
    hasDragged.current = false;
  };

  /**
   * Core swipe detection with velocity and distance thresholds.
   * Apple UX: fast swipe = instant trigger, slow drag requires crossing threshold.
   */
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    const currentX = x.get();
    const velocityX = info.velocity.x;
    const dragDistance = Math.abs(info.offset.x);

    if (dragDistance > DRAG_THRESHOLD) {
      hasDragged.current = true;
    }

    if (isOpen) {
      handleDragEndOpen(currentX, velocityX);
    } else {
      handleDragEndClosed(currentX, velocityX);
    }

    // Reset drag flag after delay (allows pointer up tap detection to read it)
    setTimeout(() => {
      hasDragged.current = false;
    }, 100);
  };

  const handleDragEndOpen = (currentX: number, velocityX: number) => {
    if (swipeSide === 'right') {
      const shouldClose = currentX > -actionWidth * 0.7 || velocityX > 10;
      if (shouldClose) {
        setSwipeSide(null);
        setOpenCard(null);
      }
    } else if (swipeSide === 'left') {
      const shouldClose = currentX < actionWidth * 0.7 || velocityX < -10;
      if (shouldClose) {
        setSwipeSide(null);
        setOpenCard(null);
      }
    }
  };

  const handleDragEndClosed = (currentX: number, velocityX: number) => {
    if (
      (directions === 'right' || directions === 'both') &&
      (currentX < -thresholds.open || velocityX < thresholds.velocity)
    ) {
      setSwipeSide('right');
      setOpenCard(cardId);
    } else if (
      (directions === 'left' || directions === 'both') &&
      (currentX > thresholds.open || velocityX > Math.abs(thresholds.velocity))
    ) {
      setSwipeSide('left');
      setOpenCard(cardId);
    } else {
      setSwipeSide(null);
      setOpenCard(null);
    }
  };

  // ============================================================================
  // Pointer-Based Tap Detection
  // ============================================================================

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  /**
   * Detect taps via pointer events (more reliable than onTap with drag).
   * A tap is a pointer down+up with < 10px movement and < 300ms duration.
   */
  const handlePointerUp = (e: React.PointerEvent): boolean => {
    if (disabled) return false;

    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    if (!start) return false;

    const distance = Math.sqrt(Math.pow(e.clientX - start.x, 2) + Math.pow(e.clientY - start.y, 2));
    const duration = Date.now() - start.time;
    const isTap = distance < TAP_MAX_DISTANCE && duration < TAP_MAX_DURATION;

    if (!isTap || hasDragged.current) return false;

    const currentX = x.get();

    // If card is open or partially open, close it
    if (isOpen || Math.abs(currentX) > thresholds.tap) {
      setSwipeSide(null);
      setOpenCard(null);
      return false;
    }

    // Card is closed: signal that onCardClick should fire
    return true;
  };

  const closeSwipe = () => {
    setSwipeSide(null);
    setOpenCard(null);
  };

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    x,
    isOpen,
    // Mask swipeSide when card is closed (handles external close via Zustand)
    swipeSide: isOpen ? swipeSide : null,

    dragHandlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
    },

    closeSwipe,
    dragConstraints,
  };
}
