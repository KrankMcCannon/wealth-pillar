import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface SkeletonListProps {
  count: number;
  height?: string;
  width?: string;
  spacing?: string;
  className?: string;
  style?: CSSProperties;
  renderItem?: (index: number) => ReactNode;
}

export function SkeletonList({
  count,
  height = 'h-16',
  width = 'w-full',
  spacing = 'flex flex-col gap-2',
  className,
  style,
  renderItem,
}: Readonly<SkeletonListProps>) {
  return (
    <div className={spacing} style={style}>
      {Array.from({ length: count }, (_, i) =>
        renderItem ? (
          <Fragment key={`skeleton-item-${i}`}>{renderItem(i)}</Fragment>
        ) : (
          <Skeleton key={`skeleton-box-${i}`} className={cn(height, width, className)} />
        )
      )}
    </div>
  );
}
