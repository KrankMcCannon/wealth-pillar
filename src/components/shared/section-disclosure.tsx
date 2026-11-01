import type { ComponentProps, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SectionDisclosureProps = Omit<ComponentProps<'details'>, 'children'> & {
  label: ReactNode;
  children: ReactNode;
};

export function SectionDisclosure({
  label,
  children,
  className,
  ...props
}: SectionDisclosureProps) {
  return (
    <details className={cn('group/disclosure min-w-0', className)} {...props}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{label}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open/disclosure:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="pb-3 pt-2">{children}</div>
    </details>
  );
}
