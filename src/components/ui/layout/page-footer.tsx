"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { layoutStyles } from "@/styles/system";

export interface PageFooterProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export function PageFooter({
  children,
  sticky = false,
  className,
}: Readonly<PageFooterProps>) {
  return (
    <footer
      className={cn(
        layoutStyles.footer.base,
        sticky ? layoutStyles.footer.sticky : layoutStyles.footer.static,
        className
      )}
    >
      {children}
    </footer>
  );
}
