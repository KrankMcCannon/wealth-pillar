"use client";

/**
 * RowCard - Unified Row Card Component
 *
 * A flexible, reusable row-based card component that supports:
 * - Icon + Title + Subtitle/Metadata layout
 * - Primary value + Secondary value + Actions on the right
 * - Optional swipe-to-delete gesture (Framer Motion)
 * - Multiple variants (regular, interactive, highlighted, muted)
 * - Full accessibility (keyboard nav, ARIA labels)
 *
 * Used across: Transactions, Accounts, Budgets, and more
 */

import { memo, useEffect, useRef } from "react";
import { motion, useMotionValue, PanInfo, animate } from "framer-motion";
import {
  rowCardStyles,
  rowCardTokens,
  getRowCardMotionStyle,
  getRowCardDeleteLayerStyle,
} from "./theme/row-card-styles";
import { cn } from "@/lib/utils";

export interface RowCardProps {
  // Layout - Left Section
  icon?: React.ReactNode;
  iconSize?: "sm" | "md" | "lg";
  iconColor?: "primary" | "warning" | "destructive" | "success" | "muted" | "accent";
  title: string;
  subtitle?: string;
  metadata?: React.ReactNode; // Flexible metadata area (badges, text, etc.)

  // Layout - Right Section
  primaryValue?: React.ReactNode; // Main value (Amount, Balance, etc.)
  secondaryValue?: React.ReactNode; // Secondary text/badge
  actions?: React.ReactNode; // Action buttons/dropdowns
  amountVariant?: "success" | "destructive" | "primary";
  rightLayout?: "stack" | "row";

  // Interaction
  variant?: "regular" | "interactive" | "highlighted" | "muted";
  onClick?: () => void;
  onDelete?: () => void; // Enables swipe-to-delete

  // Swipe gesture (optional - for transactions)
  isSwipeOpen?: boolean;
  onSwipeChange?: (open: boolean) => void;
  deleteLabel?: string; // Default: "Elimina"

  // State
  isDisabled?: boolean;
  className?: string;
  testId?: string;
}

/**
 * RowCard Component
 *
 * Provides a unified row card pattern with optional swipe-to-delete.
 * Extracted from TransactionRow to be reusable across the app.
 */
export const RowCard = memo(({
  icon,
  iconSize = "md",
  iconColor = "primary",
  title,
  subtitle,
  metadata,
  primaryValue,
  secondaryValue,
  actions,
  amountVariant = "primary",
  rightLayout = "stack",
  variant = "regular",
  onClick,
  onDelete,
  isSwipeOpen = false,
  onSwipeChange,
  deleteLabel = "Elimina",
  isDisabled = false,
  className,
  testId,
}: RowCardProps) => {
  const x = useMotionValue(0);
  const hasDragged = useRef(false); // Track if user dragged (to distinguish from tap)

  const { swipe, spring, drag, tap } = rowCardTokens.interaction;

  // Sync internal x with external isSwipeOpen state
  useEffect(() => {
    const targetX = isSwipeOpen ? -swipe.actionWidth : 0;
    if (x.get() !== targetX) {
      animate(x, targetX, {
        type: "spring",
        stiffness: spring.stiffness,
        damping: spring.damping,
      });
    }
  }, [isSwipeOpen, x, swipe.actionWidth, spring.stiffness, spring.damping]);

  const handleDragStart = () => {
    hasDragged.current = false;
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!onSwipeChange) return;

    const currentX = x.get();
    const velocityX = info.velocity.x;
    const dragDistance = Math.abs(info.offset.x);

    // If dragged more than 10px, consider it a swipe (not a tap)
    if (dragDistance > 10) {
      hasDragged.current = true;
    }

    if (isSwipeOpen) {
      // Card is open: swipe right to close
      const shouldClose = currentX > -swipe.actionWidth * 0.7 || velocityX > 10;
      onSwipeChange(!shouldClose);
    } else {
      // Card is closed: swipe left to open
      const shouldOpen = currentX < -swipe.threshold || velocityX < swipe.velocityThreshold;
      onSwipeChange(shouldOpen);
    }

    // Reset hasDragged after delay to allow handleTap to read it
    setTimeout(() => {
      hasDragged.current = false;
    }, 100);
  };

  const handleTap = () => {
    // If user just swiped, ignore tap (prevents accidental modal open)
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    const currentX = x.get();

    // If card is open or partially open
    if (isSwipeOpen || currentX < -tap.threshold) {
      // Close the swipe immediately
      onSwipeChange?.(false);

      // Call onClick after delay for smooth animation
      if (onClick) {
        setTimeout(() => {
          onClick();
        }, 200);
      }
      return;
    }

    // Card closed: call onClick directly
    onClick?.();
  };

  const handleOpenChange = (open: boolean) => {
    onSwipeChange?.(open);
  };

  // Build class names
  const cardClasses = cn(
    rowCardStyles.base,
    rowCardStyles.variant[variant],
    isDisabled && "opacity-50 cursor-not-allowed",
    className
  );

  const iconContainerClasses = cn(
    rowCardStyles.icon.container,
    rowCardStyles.icon.size[iconSize],
    rowCardStyles.icon.color[iconColor]
  );

  // If swipe-to-delete is enabled, wrap in swipe layers
  if (onDelete && onSwipeChange) {
    return (
      <div className={rowCardStyles.wrapper} data-testid={testId}>
        {/* Background Delete Layer */}
        <div
          className={rowCardStyles.swipe.deleteLayer}
          style={getRowCardDeleteLayerStyle(isSwipeOpen, swipe.actionWidth)}
          onClick={(e) => {
            e.stopPropagation();
            if (isSwipeOpen) {
              handleOpenChange(false);
            }
          }}
        >
          <div
            className={rowCardStyles.swipe.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {deleteLabel}
          </div>
        </div>

        {/* Foreground Card Content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -swipe.actionWidth, right: 0 }}
          dragElastic={drag.elastic}
          dragMomentum={false}
          style={getRowCardMotionStyle(x)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTap={handleTap}
          onClick={(e) => e.stopPropagation()}
          className={cardClasses}
        >
          {renderCardContent()}
        </motion.div>
      </div>
    );
  }

  // Regular card (no swipe)
  return (
    <div
      className={cardClasses}
      onClick={isDisabled ? undefined : onClick}
      data-testid={testId}
    >
      {renderCardContent()}
    </div>
  );

  // Helper: Render card content layout
  function renderCardContent() {
    return (
      <div className="flex items-center justify-between w-full">
        {/* Left Section */}
        <div className={rowCardStyles.layout.left}>
          {/* Icon */}
          {icon && (
            <div className={iconContainerClasses}>
              {icon}
            </div>
          )}

          {/* Content */}
          <div className={rowCardStyles.layout.content}>
            <h4 className={rowCardStyles.title}>{title}</h4>
            {subtitle && <p className={rowCardStyles.subtitle}>{subtitle}</p>}
            {metadata && <div className={rowCardStyles.metadata}>{metadata}</div>}
          </div>
        </div>

        {/* Right Section */}
        {(primaryValue || secondaryValue || actions) && (
          <div className={rightLayout === "row" ? rowCardStyles.layout.rightRow : rowCardStyles.layout.right}>
            {primaryValue && (
              <div className={cn(rowCardStyles.value, rowCardStyles.valueVariant[amountVariant])}>
                {primaryValue}
              </div>
            )}
            {secondaryValue && (
              <div className={rowCardStyles.secondaryValue}>{secondaryValue}</div>
            )}
            {actions}
          </div>
        )}
      </div>
    );
  }
});

RowCard.displayName = "RowCard";
