"use client";

import { cn } from "@/lib";
import { STICKY_HEADER_BASE } from "@/lib/utils/ui-constants";
import { stickyHeaderStyles } from "@/styles/system";

interface StickyHeaderProps {
  variant?: "primary" | "secondary" | "light";
  zIndex?: 10 | 20;
  children: React.ReactNode;
  className?: string;
}

export function StickyHeader({
  variant = "primary",
  zIndex = 20,
  children,
  className
}: StickyHeaderProps) {
  const variantClasses = {
    primary: stickyHeaderStyles.base + " px-4 py-3",
    secondary: "bg-card/70 border-primary/20 px-3 sm:px-4 py-2 sm:py-3",
    light: stickyHeaderStyles.light + " px-4 py-4"
  };

  return (
    <header
      className={cn(
        STICKY_HEADER_BASE,
        `z-${zIndex}`,
        variantClasses[variant],
        className
      )}
    >
      {children}
    </header>
  );
}
