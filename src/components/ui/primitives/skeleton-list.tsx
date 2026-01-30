import { Fragment, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";

import { SkeletonBox } from "./skeleton-box";

export interface SkeletonListProps {
  count: number;
  height?: string;
  width?: string;
  spacing?: string;
  variant?: "light" | "medium" | "dark";
  className?: string;
  style?: CSSProperties;
  renderItem?: (index: number) => ReactNode;
}

export function SkeletonList({
  count,
  height = "h-16",
  width = "w-full",
  spacing = "space-y-2",
  variant = "medium",
  className,
  style,
  renderItem
}: Readonly<SkeletonListProps>) {
  const skeletonIds = useMemo(() => {
    return Array.from({ length: count }).map(() => crypto.randomUUID());
  }, [count]);

  return (
    <div className={spacing} style={style}>
      {skeletonIds.map((id, i) =>
        renderItem ? (
          <Fragment key={`skeleton-item-${id}`}>{renderItem(i)}</Fragment>
        ) : (
          <SkeletonBox
            key={`skeleton-box-${id}`}
            height={height}
            width={width}
            variant={variant}
            className={className}
          />
        )
      )}
    </div>
  );
}
