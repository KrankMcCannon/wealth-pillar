'use client';

/**
 * SettingsItem - Unified Settings Item Component
 *
 * A flexible, reusable settings item component that supports:
 * - Icon + Label + Value layout
 * - Multiple action types (button, toggle, navigation, custom)
 * - Optional description text
 * - Variant styling (default, destructive)
 * - Optional divider for lists
 *
 * Used for: Settings pages, preferences lists, configuration screens
 */

import { memo, useId } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsItemStyles = {
  // Base container
  container:
    'flex items-center justify-between py-3 first:pt-0 last:pb-0 w-full text-left transition-colors duration-200 group hover:bg-card/60 active:bg-card/80',
  containerWithDivider:
    'flex items-center justify-between py-3 first:pt-0 last:pb-0 w-full text-left transition-colors duration-200 group hover:bg-card/60 active:bg-card/80 border-b border-primary/20',
  clickable: 'cursor-pointer',

  // Left section (icon + content)
  left: 'flex items-center gap-3 flex-1 min-w-0',

  // Icon container
  iconContainer:
    'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 shadow-sm [&_svg]:!text-current',
  iconColor: {
    default: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
  },
  icon: 'w-5 h-5',

  // Content (label + value)
  content: 'flex-1 min-w-0',
  label: 'text-sm font-semibold',
  value: 'text-xs mt-0.5',
  description: 'text-xs mt-0.5',
  textColor: {
    default: {
      label: 'text-primary',
      value: 'text-primary/70',
      description: 'text-primary/70',
    },
    destructive: {
      label: 'text-destructive',
      value: 'text-destructive/70',
      description: 'text-destructive/70',
    },
  },

  // Actions (right section)
  actions: {
    button:
      'text-primary hover:bg-primary/10 active:scale-95 transition-all duration-200 shrink-0 p-2 rounded-xl text-sm font-medium',
    buttonDestructive:
      'text-destructive hover:bg-destructive/10 active:scale-95 transition-all duration-200 shrink-0 p-2 rounded-xl text-sm font-medium',

    // Toggle switch
    toggle: {
      wrapper: 'relative inline-flex items-center cursor-pointer',
      input: 'sr-only peer',
      track:
        'relative w-11 h-6 bg-primary/20 peer-focus:ring-2 peer-focus:ring-primary rounded-full transition-colors peer-checked:bg-primary/80 peer-checked:[&>div]:translate-x-5',
      thumb:
        'absolute top-0.5 left-0.5 bg-card w-5 h-5 rounded-full transition-transform shadow-sm pointer-events-none',
    },

    // Chevron for navigation
    chevron: 'w-5 h-5 ml-2 transition-all duration-200 group-hover:translate-x-1',
    chevronColor: {
      default: 'text-primary/50 group-hover:text-primary',
      destructive: 'text-destructive/50 group-hover:text-destructive',
    },
  },

  // Disabled state
  disabled: 'opacity-50 cursor-not-allowed',
} as const;

export interface SettingsItemProps {
  // Icon + Content
  icon: React.ReactNode;
  label: string;
  value?: string | React.ReactNode;
  description?: string; // Optional subtitle

  // Action types
  actionType?: 'button' | 'toggle' | 'navigation' | 'custom';

  // For button/navigation
  buttonLabel?: string;
  onPress?: () => void;

  // For toggle
  checked?: boolean;
  onToggle?: (checked: boolean) => void;

  // For custom action
  action?: React.ReactNode;

  // Variants
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  showDivider?: boolean; // Show bottom border (for lists)

  className?: string;
}

/**
 * SettingsItem Component
 *
 * Provides a unified settings item pattern with flexible action types.
 * Eliminates duplicate code across settings pages.
 */
export const SettingsItem = memo(
  ({
    icon,
    label,
    value,
    description,
    actionType = 'custom',
    buttonLabel,
    onPress,
    checked = false,
    onToggle,
    action,
    variant = 'default',
    disabled = false,
    showDivider = false,
    className,
  }: SettingsItemProps) => {
    const t = useTranslations('SettingsItem');
    const a11yId = useId();
    const labelTextId = `${a11yId}-setting-label`;
    const descriptionTextId = `${a11yId}-setting-desc`;
    const toggleInputId = `${a11yId}-toggle`;

    const isRowButton = actionType === 'button' && !!onPress;
    const isRowNavigation = actionType === 'navigation' && !!onPress;
    const isRowClickable = isRowButton || isRowNavigation;

    // Build class names
    const containerClasses = cn(
      showDivider ? settingsItemStyles.containerWithDivider : settingsItemStyles.container,
      isRowClickable && settingsItemStyles.clickable,
      disabled && settingsItemStyles.disabled,
      className
    );

    const iconContainerClasses = cn(
      settingsItemStyles.iconContainer,
      settingsItemStyles.iconColor[variant]
    );

    // Render action based on type
    const renderAction = () => {
      if (disabled) return null;

      switch (actionType) {
        case 'button':
          return isRowButton ? (
            <span
              className={
                variant === 'destructive'
                  ? settingsItemStyles.actions.buttonDestructive
                  : settingsItemStyles.actions.button
              }
            >
              {buttonLabel || t('change')}
            </span>
          ) : (
            <button
              type="button"
              onClick={onPress}
              className={
                variant === 'destructive'
                  ? settingsItemStyles.actions.buttonDestructive
                  : settingsItemStyles.actions.button
              }
            >
              {buttonLabel || t('change')}
            </button>
          );

        case 'toggle':
          return (
            <div className={settingsItemStyles.actions.toggle.wrapper}>
              <input
                id={toggleInputId}
                type="checkbox"
                className={settingsItemStyles.actions.toggle.input}
                checked={checked}
                onChange={(e) => onToggle?.(e.target.checked)}
                disabled={disabled}
                aria-labelledby={labelTextId}
                {...(description ? { 'aria-describedby': descriptionTextId } : {})}
              />
              <label htmlFor={toggleInputId} className="inline-flex cursor-pointer">
                <div className={settingsItemStyles.actions.toggle.track} aria-hidden>
                  <div className={settingsItemStyles.actions.toggle.thumb} />
                </div>
              </label>
            </div>
          );

        case 'navigation':
          return isRowNavigation ? (
            <ChevronRight
              className={cn(
                settingsItemStyles.actions.chevron,
                settingsItemStyles.actions.chevronColor[variant]
              )}
            />
          ) : (
            <button type="button" onClick={onPress} disabled={disabled}>
              <ChevronRight
                className={cn(
                  settingsItemStyles.actions.chevron,
                  settingsItemStyles.actions.chevronColor[variant]
                )}
              />
            </button>
          );

        case 'custom':
          return action || null;

        default:
          return null;
      }
    };

    const Container = isRowClickable ? 'button' : 'div';

    const containerProps = isRowClickable
      ? { onClick: onPress, disabled, type: 'button' as const }
      : {};

    return (
      <Container className={containerClasses} {...containerProps}>
        {/* Left Section */}
        <div className={settingsItemStyles.left}>
          {/* Icon */}
          <div className={iconContainerClasses}>{icon}</div>

          {/* Content */}
          <div className={settingsItemStyles.content}>
            <div
              id={labelTextId}
              className={cn(settingsItemStyles.label, settingsItemStyles.textColor[variant].label)}
            >
              {label}
            </div>
            {value && (
              <div
                className={cn(
                  settingsItemStyles.value,
                  settingsItemStyles.textColor[variant].value
                )}
              >
                {value}
              </div>
            )}
            {description && (
              <div
                id={descriptionTextId}
                className={cn(
                  settingsItemStyles.description,
                  settingsItemStyles.textColor[variant].description
                )}
              >
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        {renderAction()}
      </Container>
    );
  }
);

SettingsItem.displayName = 'SettingsItem';
