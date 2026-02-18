import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { buttonStyles, getButtonClasses } from '@/styles/system';

type Variant = keyof typeof buttonStyles.variants;
type Size = keyof typeof buttonStyles.sizes;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const classes = getButtonClasses(variant, size, className);

    return <Comp ref={ref} data-slot="button" className={cn(classes)} {...props} />;
  }
);

/**
 * Compatibility wrapper for components expecting cva-style buttonVariants
 */
export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return getButtonClasses(variant, size, className);
}

Button.displayName = 'Button';

export { Button };
