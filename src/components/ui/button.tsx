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

Button.displayName = 'Button';

export { Button };
