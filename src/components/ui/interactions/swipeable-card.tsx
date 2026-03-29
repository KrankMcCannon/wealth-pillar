/**
 * SwipeableCard Component
 *
 * Unified swipeable card wrapper with Apple-style interactions.
 * Provides consistent swipe-to-action behavior across the app.
 *
 * @module components/ui/interactions/swipeable-card
 */

'use client';
'use no memo';

import { memo, useEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useSwipeManager } from '@/hooks/use-swipe-manager';
import {
  swipeStyles,
  appleSwipeTokens,
  getActionLayerStyle,
  getActionButtonStyle,
  getActionButtonClasses,
  type SwipeActionVariant,
} from './theme/swipe-styles';

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
  leftAction?: SwipeAction | undefined;

  /** Right swipe action (e.g., delete) */
  rightAction?: SwipeAction | undefined;

  /** Callback when card is clicked */
  onCardClick?: (() => void) | undefined;

  /** Callback when swipe opens */
  onSwipeOpen?: (side: 'left' | 'right') => void;

  /** Callback when swipe closes */
  onSwipeClose?: () => void;

  /** Disable swipe interactions */
  disabled?: boolean;

  /** Screen reader hint for the draggable row (e.g. swipe affordance onboarding) */
  dragHint?: string | undefined;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

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
    dragHint,
    className,
  }) => {
    const t = useTranslations('Common.Swipe');
    const dragHintId = useId();
    const prefersReducedMotion = useReducedMotion();

    // Determine swipe directions based on available actions
    let directions: 'left' | 'right' | 'both';
    if (leftAction && rightAction) {
      directions = 'both';
    } else if (leftAction) {
      directions = 'left';
    } else {
      directions = 'right';
    }

    const { x, isOpen, swipeSide, dragHandlers, closeSwipe, dragConstraints } = useSwipeManager({
      cardId: id,
      directions,
      disabled,
    });

    // Track previous state to detect changes
    const prevStateRef = useRef({ isOpen, swipeSide });

    // ========================================================================
    // Effect Callbacks
    // ========================================================================

    useEffect(() => {
      const prev = prevStateRef.current;

      if (!prev.isOpen && isOpen && swipeSide) {
        onSwipeOpen?.(swipeSide);
      } else if (prev.isOpen && !isOpen) {
        onSwipeClose?.();
      }

      prevStateRef.current = { isOpen, swipeSide };
    }, [isOpen, swipeSide, onSwipeOpen, onSwipeClose]);

    // ========================================================================
    // Action Handlers
    // ========================================================================

    /**
     * Close swipe and execute action immediately.
     * The close animation runs via swipe manager state sync while modal opens.
     */
    const handleActionClick = (action: SwipeAction) => {
      closeSwipe();
      action.onAction();
    };

    /**
     * Pointer-based tap detection.
     * Replaces Framer Motion's onTap which is unreliable with drag.
     */
    const handlePointerUp = (e: React.PointerEvent) => {
      const shouldTriggerClick = dragHandlers.onPointerUp(e);
      if (!shouldTriggerClick) return;
      onCardClick?.();
    };

    const handleBackdropClick = () => {
      closeSwipe();
    };
    const isCardClickable = Boolean(onCardClick) && !disabled;
    const dragEnabled = !disabled && !prefersReducedMotion;

    const handleCardKeyDown = (e: React.KeyboardEvent) => {
      if (!isCardClickable) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();

      // Match pointer behavior: if swipe is open, close first without opening details.
      if (isOpen) {
        closeSwipe();
        return;
      }
      onCardClick?.();
    };

    const isLeftOpen = swipeSide === 'left';
    const isRightOpen = swipeSide === 'right';

    const handleDragStart = dragHandlers.onDragStart;
    const handleDragEnd = dragHandlers.onDragEnd;
    const handlePointerDown = dragHandlers.onPointerDown;

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <>
        {/* Global Backdrop (rendered only by the open card) */}
        {isOpen && (
          <button
            type="button"
            className={cn(swipeStyles.backdrop.base, swipeStyles.backdrop.visible)}
            style={{ zIndex: swipeStyles.backdrop.zIndex }}
            onClick={handleBackdropClick}
            tabIndex={-1}
            aria-label={t('closeAction')}
          />
        )}

        {/* Swipe Container */}
        <div
          className={cn(swipeStyles.wrapper, className)}
          style={isOpen ? { zIndex: swipeStyles.backdrop.zIndex + 1 } : undefined}
        >
          {/* Left Action Layer (Pause/Resume) */}
          {leftAction && (
            <div
              className={cn(swipeStyles.actionLayer.base, swipeStyles.actionLayer.left)}
              style={getActionLayerStyle(
                isLeftOpen,
                'left',
                appleSwipeTokens.dimensions.actionWidthSingle
              )}
              aria-hidden={!isLeftOpen}
            >
              <button
                type="button"
                className={cn(
                  getActionButtonClasses(leftAction.variant),
                  'w-full justify-center text-center'
                )}
                style={getActionButtonStyle(isLeftOpen)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(leftAction);
                }}
                aria-label={leftAction.label}
                aria-hidden={!isLeftOpen}
                disabled={!isLeftOpen}
                tabIndex={isLeftOpen ? 0 : -1}
              >
                {leftAction.icon}
                {leftAction.label}
              </button>
            </div>
          )}

          {/* Right Action Layer (Delete) */}
          {rightAction && (
            <div
              className={cn(swipeStyles.actionLayer.base, swipeStyles.actionLayer.right)}
              style={getActionLayerStyle(
                isRightOpen,
                'right',
                appleSwipeTokens.dimensions.actionWidthSingle
              )}
              aria-hidden={!isRightOpen}
            >
              <button
                type="button"
                className={cn(
                  getActionButtonClasses(rightAction.variant),
                  'w-full justify-center text-center'
                )}
                style={getActionButtonStyle(isRightOpen)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(rightAction);
                }}
                aria-label={rightAction.label}
                aria-hidden={!isRightOpen}
                disabled={!isRightOpen}
                tabIndex={isRightOpen ? 0 : -1}
              >
                {rightAction.icon}
                {rightAction.label}
              </button>
            </div>
          )}

          {dragHint ? (
            <span id={dragHintId} className="sr-only">
              {dragHint}
            </span>
          ) : null}

          {/* Card Content (Foreground) */}
          <motion.div
            drag={dragEnabled ? 'x' : false}
            dragConstraints={dragConstraints}
            dragElastic={dragEnabled ? appleSwipeTokens.physics.drag.elastic : 0}
            dragMomentum={false}
            style={{ x }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleCardKeyDown}
            {...(isCardClickable && { role: 'button', tabIndex: 0 })}
            {...(dragHint ? { 'aria-describedby': dragHintId } : {})}
            className={swipeStyles.cardContent.base}
          >
            {children}
          </motion.div>
        </div>
      </>
    );
  }
);

SwipeableCard.displayName = 'SwipeableCard';
