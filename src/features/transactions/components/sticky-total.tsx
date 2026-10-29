'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '@/lib/utils';

/** App header is `fixed` + PageContainer `pt-[64px]`. */
export const APP_HEADER_PX = 64;

export function StickyTotal({
  children,
  totalRef,
}: {
  children: ReactNode;
  totalRef?: RefObject<HTMLDivElement | null>;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const barRef = totalRef ?? localRef;
  const [pinned, setPinned] = useState(false);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = barRef.current;
    if (!node) return;
    const sync = () => setHeight(node.offsetHeight);
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    sync();
    return () => observer.disconnect();
  }, [barRef]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setPinned(!entry.isIntersecting);
      },
      { rootMargin: `-${APP_HEADER_PX}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      {pinned ? <div style={{ height }} aria-hidden /> : null}
      <div
        ref={barRef}
        className={cn(
          'z-30 border-b border-border/22 bg-background px-4 py-2',
          pinned ? 'fixed inset-x-0' : 'relative'
        )}
        style={pinned ? { top: APP_HEADER_PX } : undefined}
      >
        {children}
      </div>
    </>
  );
}
