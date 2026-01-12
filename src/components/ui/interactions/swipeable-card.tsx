/**
 * SwipeableCard Component
 *
 * Unified swipeable card wrapper with Apple-style interactions.
 * Provides consistent swipe-to-action behavior across the app.
 *
 * @module components/ui/interactions/swipeable-card
 */

"use client";

import { memo, useEffect, useRef, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSwipeManager } from "@/hooks/use-swipe-manager";
import {
  swipeStyles,
  appleSwipeTokens,
  getActionLayerStyle,
  getActionButtonStyle,
  getActionButtonClasses,
  type SwipeActionVariant,
} from "./theme/swipe-styles";

// ============================================================================
// Types
// ============================================================================

export interface SwipeAction {
  /** Button label */
  label: string;

  /** Action variant (determines styling) */
  variant: SwipeActionVariant;

  /** Callback when action is triggered */
  onAction: () => void;

  /** Optional icon */
  icon?: React.ReactNode;
}

export interface SwipeableCardProps {
  /** Unique ID for global swipe state tracking */
  id: string;

  /** Card content */
  children: React.ReactNode;

  /** Left swipe action (e.g., pause/resume) */
  leftAction?: SwipeAction;

  /** Right swipe action (e.g., delete) */
  rightAction?: SwipeAction;

  /** Callback when card is clicked */
  onCardClick?: () => void;

  /** Callback when swipe opens */
  onSwipeOpen?: (side: "left" | "right") => void;

  /** Callback when swipe closes */
  onSwipeClose?: () => void;

  /** Disable swipe interactions */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SwipeableCard Component
 *
 * A reusable wrapper that adds swipe-to-action functionality to any card.
 *
 * Features:
 * - Global state coordination (only one card open at a time)
 * - Apple-style physics and animations
 * - Configurable left/right actions
 * - Auto-close on outside click
 * - Tap vs. drag distinction
 * - Smooth transitions and visual feedback
 *
 * Example Usage:
 * ```tsx
 * <SwipeableCard
 *   id="series-123"
 *   leftAction={{
 *     label: "Pausa",
 *     variant: "pause",
 *     onAction: handlePause
 *   }}
 *   rightAction={{
 *     label: "Elimina",
 *     variant: "delete",
 *     onAction: handleDelete
 *   }}
 *   onCardClick={handleEdit}
 * >
 *   <MyCardContent />
 * </SwipeableCard>
 * ```
 */
export const SwipeableCard = memo<SwipeableCardProps>(
  ({
    id,
    children,
    leftAction,
    rightAction,
    onCardClick,
    onSwipeOpen,
    onSwipeClose,
    disabled = false,
    className,
  }) => {
    // Determine swipe directions based on available actions
    const directions = leftAction && rightAction
      ? "both"
      : leftAction
        ? "left"
        : rightAction
          ? "right"
          : "right"; // Default to right if no actions

    // Get swipe state and handlers from hook
    const {
      x,
      isOpen,
      swipeSide,
      dragHandlers,
      closeSwipe,
      dragConstraints,
    } = useSwipeManager({
      cardId: id,
      directions,
      disabled,
    });

    // Track previous state to detect changes
    const prevStateRef = useRef({ isOpen, swipeSide });

    // ========================================================================
    // Effect Callbacks
    // ========================================================================

    /**
     * Notify parent when swipe state changes
     * Must be in useEffect to avoid calling callbacks during render
     */
    useEffect(() => {
      const prev = prevStateRef.current;

      // State changed: was closed, now open
      if (!prev.isOpen && isOpen && swipeSide) {
        onSwipeOpen?.(swipeSide);
      }
      // State changed: was open, now closed
      else if (prev.isOpen && !isOpen) {
        onSwipeClose?.();
      }

      // Update previous state
      prevStateRef.current = { isOpen, swipeSide };
    }, [isOpen, swipeSide, onSwipeOpen, onSwipeClose]);

    // ========================================================================
    // Action Handlers
    // ========================================================================

    /**
     * Handle action button click
     * Closes swipe first, then executes action after animation
     */
    const handleActionClick = (action: SwipeAction) => {
      closeSwipe(); // Close swipe immediately
      // Execute action after swipe close animation (200ms)
      setTimeout(() => {
        action.onAction();
      }, 200);
    };

    /**
     * Handle card tap
     * If open, closes swipe then triggers callback
     * If closed, triggers callback immediately
     */
    const handleCardTap = () => {
      const shouldTriggerClick = dragHandlers.onTap();
      if (!shouldTriggerClick) return;
      onCardClick?.();
    };

    /**
     * Handle backdrop click
     * Closes all open swipes
     */
    const handleBackdropClick = () => {
      closeSwipe();
    };

    // ========================================================================
    // Helper Functions
    // ========================================================================

    /**
     * Generate motion style for Framer Motion
     * Workaround for React 19 type incompatibility
     */
    const getMotionStyle = (): CSSProperties => {
      return { x } as unknown as CSSProperties;
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <>
        {/* Global Backdrop (rendered only by the open card) */}
        {isOpen && (
          <div
            className={cn(
              swipeStyles.backdrop.base,
              isOpen ? swipeStyles.backdrop.visible : swipeStyles.backdrop.hidden
            )}
            style={{ zIndex: swipeStyles.backdrop.zIndex }}
            onClick={handleBackdropClick}
            onTouchEnd={handleBackdropClick}
          />
        )}

        {/* Swipe Container */}
        <div className={cn(swipeStyles.wrapper, className)}>
          {/* Left Action Layer (Pause/Resume) */}
          {leftAction && (
            <div
              className={cn(
                swipeStyles.actionLayer.base,
                swipeStyles.actionLayer.left
              )}
              style={getActionLayerStyle(
                swipeSide === "left",
                "left",
                appleSwipeTokens.dimensions.actionWidthSingle
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (swipeSide === "left") {
                  closeSwipe();
                }
              }}
            >
              <div
                className={cn(getActionButtonClasses(leftAction.variant), "w-full justify-center text-center")}
                style={getActionButtonStyle(swipeSide === "left")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(leftAction);
                }}
              >
                {leftAction.icon && leftAction.icon}
                {leftAction.label}
              </div>
            </div>
          )}

          {/* Right Action Layer (Delete) */}
          {rightAction && (
            <div
              className={cn(
                swipeStyles.actionLayer.base,
                swipeStyles.actionLayer.right
              )}
              style={getActionLayerStyle(
                swipeSide === "right",
                "right",
                appleSwipeTokens.dimensions.actionWidthSingle
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (swipeSide === "right") {
                  closeSwipe();
                }
              }}
            >
              <div
                className={cn(getActionButtonClasses(rightAction.variant), "w-full justify-center text-center")}
                style={getActionButtonStyle(swipeSide === "right")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(rightAction);
                }}
              >
                {rightAction.icon && rightAction.icon}
                {rightAction.label}
              </div>
            </div>
          )}

          {/* Card Content (Foreground) */}
          <motion.div
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={appleSwipeTokens.physics.drag.elastic}
            dragMomentum={false}
            style={getMotionStyle()}
            onDragStart={dragHandlers.onDragStart}
            onDragEnd={dragHandlers.onDragEnd}
            onTap={handleCardTap}
            onClick={(e) => e.stopPropagation()}
            className={swipeStyles.cardContent.base}
          >
            {children}
          </motion.div>
        </div>
      </>
    );
  },
  // Custom comparison: only re-render if id or actions change
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.leftAction === next.leftAction &&
      prev.rightAction === next.rightAction &&
      prev.disabled === next.disabled
    );
  }
);

SwipeableCard.displayName = "SwipeableCard";
