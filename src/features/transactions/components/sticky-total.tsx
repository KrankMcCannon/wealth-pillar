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
  const [headerHeight, setHeaderHeight] = useState(APP_HEADER_PX);

  useLayoutEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const sync = () => setHeaderHeight(header.getBoundingClientRect().height);
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    sync();
    return () => observer.disconnect();
  }, []);

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
      { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [headerHeight]);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      {pinned ? <div style={{ height }} aria-hidden /> : null}
      <div
        ref={barRef}
        className={cn(
          'z-30 border-b border-border/22 bg-background py-2',
          pinned ? 'fixed inset-x-0' : 'relative'
        )}
        style={pinned ? { top: headerHeight } : undefined}
      >
        <div className="mx-auto w-full max-w-5xl px-4">{children}</div>
      </div>
    </>
  );
}
