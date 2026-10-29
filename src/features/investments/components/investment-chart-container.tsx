'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InvestmentChartContainerProps extends ComponentProps<'div'> {
  children: ReactNode;
}

/**
 * Renders chart children only when the container has measurable size.
 * Avoids Recharts "width(0) and height(0)" warnings from hidden or not-yet-laid-out parents.
 */
export function InvestmentChartContainer({
  className,
  children,
  ...props
}: InvestmentChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setReady(width > 0 && height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(className)} {...props}>
      {ready ? children : null}
    </div>
  );
}
