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
  deleteAction?: SwipeAction | undefined;

  /** Optional callback when card is clicked */
  onCardClick?: (() => void) | undefined;
}

export interface RowCardProps {
  // Layout - Left Section
  icon?: React.ReactNode;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg';
  iconColor?: 'primary' | 'warning' | 'destructive' | 'success' | 'muted' | 'accent' | 'none';
  iconStyle?: CSSProperties;
  iconClassName?: string;
  title: string;
  subtitle?: React.ReactNode;
  metadata?: React.ReactNode; // Flexible metadata area (badges, text, etc.)

  // Layout - Right Section
  primaryValue?: React.ReactNode; // Main value (Amount, Balance, etc.)
  secondaryValue?: React.ReactNode | undefined; // Secondary text/badge
  actions?: React.ReactNode; // Action buttons/dropdowns
  amountVariant?: 'success' | 'destructive' | 'primary';
  rightLayout?: 'stack' | 'row';

  // Interaction
  variant?: 'regular' | 'interactive' | 'highlighted' | 'muted';
  onClick?: (() => void) | undefined;

  // Swipe configuration (new unified system)
  swipeConfig?: RowCardSwipeConfig | undefined;

  /** Hint linked to the swipe surface for assistive technology */
  swipeDragHint?: string | undefined;

  // State
  isDisabled?: boolean;
  className?: string;
  testId?: string;
  /** Layout compatto (slider conti): una riga per titolo e per sottotitolo, larghezza da contenuto. */
  compact?: boolean;
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
    swipeDragHint,
    isDisabled = false,
    iconStyle,
    iconClassName,
    className,
    testId,
    compact = false,
  }: RowCardProps) => {
    // Build class names
    const cardClasses = cn(
      rowCardStyles.base,
      rowCardStyles.variant[variant],
      isDisabled && 'opacity-50 cursor-not-allowed',
      compact && 'max-w-[min(94vw,24rem)]',
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
      <div
        className={cn(
          'flex justify-between gap-2',
          compact ? 'w-max min-w-0 items-center' : 'w-full items-center'
        )}
      >
        {/* Left Section */}
        <div
          className={cn(
            rowCardStyles.layout.left,
            compact && 'w-auto flex-none min-w-0 items-center gap-1.5'
          )}
        >
          {/* Icon */}
          {icon && (
            <div className={iconContainerClasses} style={iconStyle}>
              {icon}
            </div>
          )}

          {/* Content */}
          <div className={cn(rowCardStyles.layout.content, compact && 'w-max min-w-0 flex-none')}>
            <h4
              className={cn(
                rowCardStyles.title,
                compact &&
                  'overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium leading-tight'
              )}
            >
              {title}
            </h4>
            {subtitle && (
              <p
                className={cn(
                  rowCardStyles.subtitle,
                  compact &&
                    'mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] leading-tight text-primary/70'
                )}
              >
                {subtitle}
              </p>
            )}
            {metadata && <div className={rowCardStyles.metadata}>{metadata}</div>}
          </div>
        </div>

        {/* Right Section */}
        {(primaryValue || secondaryValue || actions) && (
          <div
            className={cn(
              rightLayout === 'row' ? rowCardStyles.layout.rightRow : rowCardStyles.layout.right,
              compact &&
                rightLayout === 'row' &&
                'ml-2 shrink-0 tabular-nums whitespace-nowrap sm:ml-2.5'
            )}
          >
            {primaryValue && (
              <div
                className={cn(
                  rowCardStyles.value,
                  rowCardStyles.valueVariant[amountVariant],
                  compact && 'text-sm font-semibold tabular-nums whitespace-nowrap'
                )}
              >
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
      const cardClick = swipeConfig.onCardClick ?? onClick;
      return (
        <SwipeableCard
          id={swipeConfig.id}
          rightAction={swipeConfig.deleteAction}
          {...(cardClick !== undefined && { onCardClick: cardClick })}
          {...(swipeDragHint !== undefined && { dragHint: swipeDragHint })}
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

    const isClickable = Boolean(onClick) && !isDisabled;
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isClickable || !onClick) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <div
        className={cardClasses}
        onClick={isClickable ? onClick : undefined}
        {...(isClickable && {
          role: 'button',
          tabIndex: 0,
          onKeyDown: handleKeyDown,
        })}
        data-testid={testId}
      >
        {renderCardContent()}
      </div>
    );
  }
);

RowCard.displayName = 'RowCard';
