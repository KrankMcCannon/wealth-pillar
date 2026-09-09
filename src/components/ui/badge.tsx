import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const badgeBase =
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow,background-color] [&>svg]:size-3 [&>svg]:pointer-events-none';

const badgeVariants = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
  destructive:
    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'text-foreground border-border hover:bg-accent',
} as const;

type Variant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span';
    const variantClass = badgeVariants[variant] ?? badgeVariants.default;

    return (
      <Comp
        ref={ref}
        data-slot="badge"
        className={cn(badgeBase, variantClass, className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
