"use client";

import { StickyHeader } from "./sticky-header";
import { BackButton } from "@/components/shared/back-button";
import { cn } from "@/lib";

interface PageHeaderWithBackProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
  className?: string;
  contentClassName?: string;
  titleWrapperClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  backButtonClassName?: string;
}

export function PageHeaderWithBack({
  title,
  subtitle,
  onBack,
  actions,
  variant = "primary",
  className,
  contentClassName,
  titleWrapperClassName,
  titleClassName,
  subtitleClassName,
  backButtonClassName
}: PageHeaderWithBackProps) {
  return (
    <StickyHeader variant={variant} className={className}>
      <div className={cn("flex items-center gap-3", contentClassName)}>
        <BackButton onClick={onBack} className={backButtonClassName} />
        <div className={cn("flex flex-1 flex-col items-center text-center", titleWrapperClassName)}>
          <h1 className={cn("text-base sm:text-lg font-semibold text-primary", titleClassName)}>
            {title}
          </h1>
          {subtitle ? (
            <p className={cn("text-sm text-muted-foreground", subtitleClassName)}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? actions : <div className="w-10" />}
      </div>
    </StickyHeader>
  );
}
