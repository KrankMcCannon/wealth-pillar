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

import { memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    className,
  }) => {
    const t = useTranslations('Common.Swipe');

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
            className={cn(swipeStyles.backdrop.base, swipeStyles.backdrop.visible)}
            style={{ zIndex: swipeStyles.backdrop.zIndex }}
            onClick={handleBackdropClick}
            onTouchEnd={handleBackdropClick}
            tabIndex={-1}
            aria-label={t('closeAction')}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                handleBackdropClick();
              }
            }}
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
              role="button"
              tabIndex={0}
              className={cn(swipeStyles.actionLayer.base, swipeStyles.actionLayer.left)}
              style={getActionLayerStyle(
                swipeSide === 'left',
                'left',
                appleSwipeTokens.dimensions.actionWidthSingle
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  if (swipeSide === 'left') closeSwipe();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (swipeSide === 'left') {
                  closeSwipe();
                }
              }}
            >
              <button
                type="button"
                className={cn(
                  getActionButtonClasses(leftAction.variant),
                  'w-full justify-center text-center'
                )}
                style={getActionButtonStyle(swipeSide === 'left')}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(leftAction);
                }}
                aria-label={leftAction.label}
              >
                {leftAction.icon}
                {leftAction.label}
              </button>
            </div>
          )}

          {/* Right Action Layer (Delete) */}
          {rightAction && (
            <div
              role="button"
              tabIndex={0}
              className={cn(swipeStyles.actionLayer.base, swipeStyles.actionLayer.right)}
              style={getActionLayerStyle(
                swipeSide === 'right',
                'right',
                appleSwipeTokens.dimensions.actionWidthSingle
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  if (swipeSide === 'right') closeSwipe();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (swipeSide === 'right') {
                  closeSwipe();
                }
              }}
            >
              <button
                type="button"
                className={cn(
                  getActionButtonClasses(rightAction.variant),
                  'w-full justify-center text-center'
                )}
                style={getActionButtonStyle(swipeSide === 'right')}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(rightAction);
                }}
                aria-label={rightAction.label}
              >
                {rightAction.icon}
                {rightAction.label}
              </button>
            </div>
          )}

          {/* Card Content (Foreground) */}
          <motion.div
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={appleSwipeTokens.physics.drag.elastic}
            dragMomentum={false}
            style={{ x }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={(e) => e.stopPropagation()}
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
