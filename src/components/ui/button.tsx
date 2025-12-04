import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/src/lib";
import { buttonStyles, getButtonClasses } from "@/styles/system";

type Variant = keyof typeof buttonStyles.variants;
type Size = keyof typeof buttonStyles.sizes;

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";
  const classes = getButtonClasses(variant, size, className);

  return (
    <Comp data-slot="button" className={cn(classes)} {...props} />
  );
}

export { Button }
