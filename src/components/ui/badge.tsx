import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { badgeStyles } from "@/styles/system";

type Variant = keyof typeof badgeStyles.variants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    const variantClass = badgeStyles.variants[variant] ?? badgeStyles.variants.default;

    return (
      <Comp
        ref={ref}
        data-slot="badge"
        className={cn(badgeStyles.base, variantClass, className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
