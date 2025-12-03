"use client";

import { cn } from "@/lib";

export interface SkeletonBoxProps {
  height: string;
  width?: string;
  variant?: "light" | "medium" | "dark";
  className?: string;
}

export function SkeletonBox({
  height,
  width,
  variant = "medium",
  className
}: SkeletonBoxProps) {
  const variantClasses = {
    light: "bg-slate-50",
    medium: "bg-slate-100",
    dark: "bg-slate-200"
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        "rounded-lg animate-pulse",
        className
      )}
      style={{ height, width }}
    />
  );
}
