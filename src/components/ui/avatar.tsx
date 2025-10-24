'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/src/lib';

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

type AvatarImageProps = Omit<React.ComponentProps<typeof Image>, 'fill'> & {
  alt?: string;
};

const AvatarImage = ({ className, alt = '', ...props }: AvatarImageProps) => (
  <Image
    alt={alt}
    className={cn('aspect-square h-full w-full object-cover', className)}
    sizes={props.sizes ?? '40px'}
    // Use fill to cover the avatar container
    fill
    {...props}
  />
);

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
