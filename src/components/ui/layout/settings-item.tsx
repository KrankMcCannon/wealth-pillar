"use client";

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

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { settingsItemStyles } from "./theme/settings-item-styles";
import { cn } from "@/lib/utils";

export interface SettingsItemProps {
  // Icon + Content
  icon: React.ReactNode;
  label: string;
  value?: string | React.ReactNode;
  description?: string; // Optional subtitle

  // Action types
  actionType?: "button" | "toggle" | "navigation" | "custom";

  // For button/navigation
  buttonLabel?: string;
  onPress?: () => void;

  // For toggle
  checked?: boolean;
  onToggle?: (checked: boolean) => void;

  // For custom action
  action?: React.ReactNode;

  // Variants
  variant?: "default" | "destructive";
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
export const SettingsItem = memo(({
  icon,
  label,
  value,
  description,
  actionType = "custom",
  buttonLabel,
  onPress,
  checked = false,
  onToggle,
  action,
  variant = "default",
  disabled = false,
  showDivider = false,
  className,
}: SettingsItemProps) => {
  const isRowButton = actionType === "button" && !!onPress;
  const isRowNavigation = actionType === "navigation" && !!onPress;
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
      case "button":
        return isRowButton ? (
          <span className={variant === "destructive" ? settingsItemStyles.actions.buttonDestructive : settingsItemStyles.actions.button}>
            {buttonLabel || "Cambia"}
          </span>
        ) : (
          <button
            type="button"
            onClick={onPress}
            className={variant === "destructive" ? settingsItemStyles.actions.buttonDestructive : settingsItemStyles.actions.button}
          >
            {buttonLabel || "Cambia"}
          </button>
        );

      case "toggle":
        return (
          <label className={settingsItemStyles.actions.toggle.wrapper}>
            <input
              type="checkbox"
              className={settingsItemStyles.actions.toggle.input}
              checked={checked}
              onChange={(e) => onToggle?.(e.target.checked)}
              disabled={disabled}
            />
            <div className={settingsItemStyles.actions.toggle.track}>
              <div className={settingsItemStyles.actions.toggle.thumb} />
            </div>
          </label>
        );

      case "navigation":
        return isRowNavigation ? (
          <ChevronRight className={cn(settingsItemStyles.actions.chevron, settingsItemStyles.actions.chevronColor[variant])} />
        ) : (
          <button type="button" onClick={onPress} disabled={disabled}>
            <ChevronRight className={cn(settingsItemStyles.actions.chevron, settingsItemStyles.actions.chevronColor[variant])} />
          </button>
        );

      case "custom":
        return action || null;

      default:
        return null;
    }
  };

  const Container = isRowClickable ? "button" : "div";

  const containerProps = isRowClickable
    ? { onClick: onPress, disabled, type: "button" as const }
    : {};

  return (
    <Container className={containerClasses} {...containerProps}>
      {/* Left Section */}
      <div className={settingsItemStyles.left}>
        {/* Icon */}
        <div className={iconContainerClasses}>
          {icon}
        </div>

        {/* Content */}
        <div className={settingsItemStyles.content}>
          <div className={cn(settingsItemStyles.label, settingsItemStyles.textColor[variant].label)}>
            {label}
          </div>
          {value && (
            <div className={cn(settingsItemStyles.value, settingsItemStyles.textColor[variant].value)}>
              {value}
            </div>
          )}
          {description && (
            <div className={cn(settingsItemStyles.description, settingsItemStyles.textColor[variant].description)}>
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      {renderAction()}
    </Container>
  );
});

SettingsItem.displayName = "SettingsItem";
