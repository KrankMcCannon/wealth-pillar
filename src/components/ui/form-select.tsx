"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from '@/src/lib';

/**
 * Form Select Component
 *
 * Enhanced select component with optional icon support and sorting.
 * Designed for use in forms with consistent styling.
 *
 * @example
 * ```tsx
 * <FormSelect
 *   value={formData.category}
 *   onValueChange={(value) => handleChange('category', value)}
 *   options={categories}
 *   placeholder="Seleziona categoria"
 *   renderIcon={(option) => <CategoryIcon categoryKey={option.key} />}
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface FormSelectProps {
  /** Current selected value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Array of options */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show empty option */
  showEmpty?: boolean;
  /** Empty option label */
  emptyLabel?: string;
  /** Function to render custom icon for option */
  renderIcon?: (option: SelectOption) => React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "Seleziona...",
  disabled = false,
  className,
  renderIcon,
}: FormSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "bg-card border-primary/20 focus:ring-2 focus:ring-primary/20",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            <div className="flex items-center gap-2">
              {renderIcon && renderIcon(option)}
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts array of items to SelectOption format
 */
export function toSelectOptions<T extends { id?: string; key?: string; label?: string; name?: string }>(
  items: T[],
  getValue: (item: T) => string = (item) => item.id || item.key || '',
  getLabel: (item: T) => string = (item) => item.label || item.name || ''
): SelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
  }));
}

/**
 * Sorts select options alphabetically by label
 */
export function sortSelectOptions(
  options: SelectOption[],
  locale: string = 'it'
): SelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, locale));
}

// Export types
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
