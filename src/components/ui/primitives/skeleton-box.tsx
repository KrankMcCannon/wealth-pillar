import { cn } from '@/lib/utils';
import { skeletonStyles } from '@/styles/system';

export interface SkeletonBoxProps {
  height: string;
  width?: string | undefined;
  variant?: 'light' | 'medium' | 'dark';
  className?: string | undefined;
}

export function SkeletonBox({
  height,
  width,
  variant = 'medium',
  className,
}: Readonly<SkeletonBoxProps>) {
  const variantClasses = {
    light: skeletonStyles.light,
    medium: skeletonStyles.medium,
    dark: skeletonStyles.dark,
  };

  return (
    <div
      className={cn(
        skeletonStyles.base,
        variantClasses[variant],
        'rounded-lg',
        height,
        width,
        className
      )}
    />
  );
}
