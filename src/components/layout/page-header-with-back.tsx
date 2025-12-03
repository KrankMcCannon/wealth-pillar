"use client";

import { StickyHeader } from "./sticky-header";
import { BackButton } from "@/components/shared/back-button";

interface PageHeaderWithBackProps {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
}

export function PageHeaderWithBack({
  title,
  onBack,
  actions,
  variant = "primary"
}: PageHeaderWithBackProps) {
  return (
    <StickyHeader variant={variant}>
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} />
        <h1 className="text-base sm:text-lg font-semibold text-primary">{title}</h1>
        {actions ? actions : <div className="w-10" />}
      </div>
    </StickyHeader>
  );
}
