"use client";

import * as React from "react";
import { cn } from "@/lib";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui";
import { formStyles } from "./theme/form-styles";

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
  const [searchValue, setSearchValue] = React.useState("");

  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;

    const lowerSearch = searchValue.toLowerCase();
    return options.filter(
      (option) => option.label.toLowerCase().includes(lowerSearch) || option.value.toLowerCase().includes(lowerSearch)
    );
  }, [searchValue, options]);

  // Reset search when dropdown closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchValue("");
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} onOpenChange={handleOpenChange}>
      <SelectTrigger className={cn(formStyles.select.trigger, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={formStyles.select.content}>
        {/* Search Input */}
        <div className={formStyles.select.searchWrap}>
          <div className={formStyles.select.searchFieldWrap}>
            <Search className={formStyles.select.searchIcon} />
            <input
              type="text"
              placeholder="Cerca..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                // Prevent Select's keyboard navigation
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={formStyles.select.searchInput}
            />
          </div>
        </div>

        {/* Options List */}
        <div className={formStyles.select.optionsWrap}>
          {filteredOptions.length === 0 ? (
            <div className={formStyles.select.empty}>Nessun risultato trovato</div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                <div className={formStyles.select.optionRow}>
                  {renderIcon && renderIcon(option)}
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))
          )}
        </div>
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
  getValue: (item: T) => string = (item) => item.id || item.key || "",
  getLabel: (item: T) => string = (item) => item.label || item.name || ""
): SelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
  }));
}

/**
 * Sorts select options alphabetically by label
 */
export function sortSelectOptions(options: SelectOption[], locale: string = "it"): SelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, locale));
}
