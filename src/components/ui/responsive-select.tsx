'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { ResponsivePicker } from '@/components/ui/responsive-picker';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface ResponsiveSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface ResponsiveSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: ResponsiveSelectOption[];
  trigger: React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
  renderOption?: (option: ResponsiveSelectOption, isSelected: boolean) => React.ReactNode;
}

/**
 * ResponsiveSelect Component
 *
 * A standardized select component that:
 * 1. Uses ResponsivePicker (Popover on desktop, Drawer on mobile)
 * 2. Uses Command (cmdk) for searchable lists
 * 3. Supports custom rendering and icons
 */
export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  trigger,
  placeholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  contentClassName,
  renderOption,
}: ResponsiveSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      // Find the option by label (because cmdk uses the value prop for filtering)
      // or by value if we pass it carefully.
      // Actually, we can just use the closure to get the original value.
      onValueChange(selectedValue);
      setOpen(false);
    },
    [onValueChange]
  );

  return (
    <ResponsivePicker
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      className={className}
      contentClassName={cn('p-0 sm:w-[300px]', contentClassName)}
    >
      <Command>
        <CommandInput placeholder={placeholder} />
        <CommandList className="max-h-[300px] overflow-y-auto">
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {renderOption ? (
                    renderOption(option, isSelected)
                  ) : (
                    <div className="flex items-center gap-2 overflow-hidden">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </div>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsivePicker>
  );
}
