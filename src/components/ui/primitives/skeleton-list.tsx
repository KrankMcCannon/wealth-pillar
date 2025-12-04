import { Fragment } from "react";
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
}: SkeletonListProps) {
  return (
    <div className={spacing} style={style}>
      {Array.from({ length: count }).map((_, i) =>
        renderItem ? (
          <Fragment key={i}>{renderItem(i)}</Fragment>
        ) : (
          <SkeletonBox
            key={i}
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
