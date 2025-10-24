import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Label({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"label"> &
  VariantProps<typeof labelVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "label"

  return (
    <Comp
      data-slot="label"
      className={cn(labelVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Label, labelVariants }