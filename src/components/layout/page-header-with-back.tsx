"use client";

import { StickyHeader } from "./sticky-header";
import { BackButton } from "@/components/shared/back-button";
import { cn } from "@/lib";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";
import { MoreVertical, LucideIcon } from "lucide-react";

/**
 * Action menu item configuration
 */
export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface PageHeaderWithBackProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  /** Custom actions element (use this OR actionsMenu, not both) */
  actions?: React.ReactNode;
  /** Array of action menu items - creates a dropdown automatically */
  actionsMenu?: ActionMenuItem[];
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
  actionsMenu,
  variant = "primary",
  className,
  contentClassName,
  titleWrapperClassName,
  titleClassName,
  subtitleClassName,
  backButtonClassName
}: PageHeaderWithBackProps) {
  // Render actions menu if provided
  const renderActions = () => {
    if (actionsMenu && actionsMenu.length > 0) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={backButtonClassName}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
            sideOffset={8}
          >
            {actionsMenu.map((item, idx) => (
              <DropdownMenuItem
                key={idx}
                className="text-sm font-medium text-primary hover:bg-primary hover:text-white rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                onClick={item.onClick}
              >
                {item.icon && <item.icon className="mr-3 h-4 w-4" />}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (actions) {
      return actions;
    }

    return <div className="w-10" />;
  };

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
        {renderActions()}
      </div>
    </StickyHeader>
  );
}
