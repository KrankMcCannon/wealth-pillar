"use client";

import { cn } from "@/lib";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "relative flex size-full min-h-[100dvh] flex-col bg-card",
        className
      )}
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      {children}
    </div>
  );
}
