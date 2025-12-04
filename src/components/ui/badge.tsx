import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/src/lib";
import { badgeStyles } from "@/styles/system";

type Variant = keyof typeof badgeStyles.variants;

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { variant?: Variant; asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  const variantClass = badgeStyles.variants[variant] ?? badgeStyles.variants.default;

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeStyles.base, variantClass, className)}
      {...props}
    />
  );
}

export { Badge };
