/**
 * FilterBar - Generic filter bar component
 */

"use client";

import { cn } from '@/src/lib';;
import { Filter } from "lucide-react";
import { Button } from "./button";

interface FilterBarProps {
  activeFiltersCount?: number;
  onOpenFilters: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({ activeFiltersCount = 0, onOpenFilters, children, className }: FilterBarProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filtri
        {activeFiltersCount > 0 && (
          <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-xs">
            {activeFiltersCount}
          </span>
        )}
      </Button>
      {children}
    </div>
  );
}
