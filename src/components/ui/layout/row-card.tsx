'use client';

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

import { memo, type CSSProperties } from 'react';
import { rowCardStyles } from './theme/row-card-styles';
import { cn } from '@/lib/utils';
import { SwipeableCard, type SwipeAction } from '@/components/ui/interactions/swipeable-card';

export interface RowCardSwipeConfig {
  /** Unique ID for swipe state tracking */
  id: string;

  /** Delete action configuration */
  deleteAction?: SwipeAction;

  /** Optional callback when card is clicked */
  onCardClick?: () => void;
}

export interface RowCardProps {
  // Layout - Left Section
  icon?: React.ReactNode;
  iconSize?: 'sm' | 'md' | 'lg';
  iconColor?: 'primary' | 'warning' | 'destructive' | 'success' | 'muted' | 'accent' | 'none';
  iconStyle?: CSSProperties;
  iconClassName?: string;
  title: string;
  subtitle?: React.ReactNode;
  metadata?: React.ReactNode; // Flexible metadata area (badges, text, etc.)

  // Layout - Right Section
  primaryValue?: React.ReactNode; // Main value (Amount, Balance, etc.)
  secondaryValue?: React.ReactNode; // Secondary text/badge
  actions?: React.ReactNode; // Action buttons/dropdowns
  amountVariant?: 'success' | 'destructive' | 'primary';
  rightLayout?: 'stack' | 'row';

  // Interaction
  variant?: 'regular' | 'interactive' | 'highlighted' | 'muted';
  onClick?: () => void;

  // Swipe configuration (new unified system)
  swipeConfig?: RowCardSwipeConfig;

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
export const RowCard = memo(
  ({
    icon,
    iconSize = 'md',
    iconColor = 'primary',
    title,
    subtitle,
    metadata,
    primaryValue,
    secondaryValue,
    actions,
    amountVariant = 'primary',
    rightLayout = 'stack',
    variant = 'regular',
    onClick,
    swipeConfig,
    isDisabled = false,
    iconStyle,
    iconClassName,
    className,
    testId,
  }: RowCardProps) => {
    // Build class names
    const cardClasses = cn(
      rowCardStyles.base,
      rowCardStyles.variant[variant],
      isDisabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const iconContainerClasses = cn(
      rowCardStyles.icon.container,
      rowCardStyles.icon.size[iconSize],
      rowCardStyles.icon.color[iconColor],
      iconClassName
    );

    // ========================================================================
    // Render Card Content
    // ========================================================================

    const renderCardContent = () => (
      <div className="flex items-center justify-between w-full">
        {/* Left Section */}
        <div className={rowCardStyles.layout.left}>
          {/* Icon */}
          {icon && (
            <div className={iconContainerClasses} style={iconStyle}>
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
          <div
            className={
              rightLayout === 'row' ? rowCardStyles.layout.rightRow : rowCardStyles.layout.right
            }
          >
            {primaryValue && (
              <div className={cn(rowCardStyles.value, rowCardStyles.valueVariant[amountVariant])}>
                {primaryValue}
              </div>
            )}
            {secondaryValue && <div className={rowCardStyles.secondaryValue}>{secondaryValue}</div>}
            {actions}
          </div>
        )}
      </div>
    );

    // ========================================================================
    // Render with Swipe Support (New Unified System)
    // ========================================================================

    if (swipeConfig) {
      return (
        <SwipeableCard
          id={swipeConfig.id}
          rightAction={swipeConfig.deleteAction}
          onCardClick={swipeConfig.onCardClick || onClick}
          disabled={isDisabled}
        >
          <div className={cardClasses} data-testid={testId}>
            {renderCardContent()}
          </div>
        </SwipeableCard>
      );
    }

    // ========================================================================
    // Regular Card (No Swipe)
    // ========================================================================

    return (
      <div className={cardClasses} onClick={isDisabled ? undefined : onClick} data-testid={testId}>
        {renderCardContent()}
      </div>
    );
  }
);

RowCard.displayName = 'RowCard';
