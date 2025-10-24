/**
 * FilterChip - Applied filter chip with remove
 */

"use client";

import { X } from "lucide-react";
import { Badge } from "./badge";

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      <span className="text-xs">{label}: {value}</span>
      <button
        onClick={onRemove}
        className="hover:bg-destructive/20 rounded-sm p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
