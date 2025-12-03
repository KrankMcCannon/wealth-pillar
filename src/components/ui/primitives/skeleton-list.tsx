"use client";

import { SkeletonBox } from "./skeleton-box";

export interface SkeletonListProps {
  count: number;
  height?: string;
  spacing?: string;
  variant?: "light" | "medium" | "dark";
  className?: string;
}

export function SkeletonList({
  count,
  height = "h-16",
  spacing = "space-y-2",
  variant = "medium",
  className
}: SkeletonListProps) {
  return (
    <div className={spacing}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={height}
          variant={variant}
          className={className}
        />
      ))}
    </div>
  );
}
