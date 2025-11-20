"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from '@/src/lib';
import { Checkbox, Input, Label } from "../ui";

/**
 * Form Checkbox Group Component
 *
 * Multiple selection checkbox group with search and select all/none.
 * Supports custom icons and filtering.
 *
 * @example
 * ```tsx
 * <FormCheckboxGroup
 *   value={formData.categories}
 *   onChange={(values) => handleChange('categories', values)}
 *   options={categories}
 *   renderIcon={(option) => <CategoryIcon categoryKey={option.value} />}
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CheckboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface FormCheckboxGroupProps {
  /** Currently selected values */
  value: string[];
  /** Callback when values change */
  onChange: (values: string[]) => void;
  /** Array of options */
  options: CheckboxOption[];
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Show select all/none buttons */
  showSelectAll?: boolean;
  /** Function to render custom icon for option */
  renderIcon?: (option: CheckboxOption) => React.ReactNode;
  /** Maximum height before scrolling */
  maxHeight?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormCheckboxGroup({
  value,
  onChange,
  options,
  disabled = false,
  className,
  showSearch = false,
  searchPlaceholder = "Cerca...",
  showSelectAll = true,
  renderIcon,
  maxHeight = "200px",
}: FormCheckboxGroupProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Check if all options are selected
  const allSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((opt) => value.includes(opt.value));

  // Handle individual checkbox toggle
  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    onChange(newValue);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (disabled) return;

    if (allSelected) {
      // Deselect all filtered options
      const filteredValues = filteredOptions.map((opt) => opt.value);
      const newValue = value.filter((v) => !filteredValues.includes(v));
      onChange(newValue);
    } else {
      // Select all filtered options
      const filteredValues = filteredOptions.map((opt) => opt.value);
      const newValue = Array.from(new Set([...value, ...filteredValues]));
      onChange(newValue);
    }
  };

  // Handle select none
  const handleSelectNone = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className={cn("flex flex-col gap-2 max-h-fit", className)}>
      {/* Search */}
      {showSearch && (
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-primary/20 text-sm"
            disabled={disabled}
          />
        </div>
      )}

      {/* Select All/None Buttons */}
      {showSelectAll && filteredOptions.length > 0 && (
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className={cn(
              "text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed",
              allSelected && "font-semibold"
            )}
          >
            {allSelected ? "Deseleziona" : "Seleziona"}
          </button>
          {value.length > 0 && (
            <>
              <span className="text-primary/50">•</span>
              <button
                type="button"
                onClick={handleSelectNone}
                disabled={disabled}
                className="text-foreground/70 hover:text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deseleziona
              </button>
            </>
          )}
          <span className="ml-auto text-foreground/70 text-xs">
            {value.length}/{options.length}
          </span>
        </div>
      )}

      {/* Checkbox List */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto space-y-2 pr-1",
          "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        )}
        style={{ maxHeight }}
      >
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-foreground/70 text-center py-4">
            Nessun risultato
          </p>
        ) : (
          filteredOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center space-x-2 p-3 rounded-lg",
                "border border-primary/10 bg-card",
                "hover:bg-primary/5 transition-colors",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ contentVisibility: 'auto' }}
            >
              <Checkbox
                id={`checkbox-${option.value}`}
                checked={value.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
                disabled={disabled || option.disabled}
                className="shrink-0"
              />
              <Label
                htmlFor={`checkbox-${option.value}`}
                className={cn(
                  "flex items-center gap-2 flex-1 cursor-pointer text-sm",
                  (disabled || option.disabled) && "cursor-not-allowed"
                )}
              >
                {renderIcon && renderIcon(option)}
                {option.icon && <span>{option.icon}</span>}
                <span className="font-medium">{option.label}</span>
              </Label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts array of items to CheckboxOption format
 */
export function toCheckboxOptions<
  T extends { id?: string; key?: string; label?: string; name?: string }
>(
  items: T[],
  getValue: (item: T) => string = (item) => item.id || item.key || "",
  getLabel: (item: T) => string = (item) => item.label || item.name || ""
): CheckboxOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
  }));
}

/**
 * Sorts checkbox options alphabetically by label
 */
export function sortCheckboxOptions(
  options: CheckboxOption[],
  locale: string = "it"
): CheckboxOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, locale));
}

/**
 * Groups checkbox options by a criterion
 */
export function groupCheckboxOptions<T extends CheckboxOption>(
  options: T[],
  groupBy: (option: T) => string
): Record<string, T[]> {
  return options.reduce(
    (groups, option) => {
      const key = groupBy(option);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(option);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// Export types
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
