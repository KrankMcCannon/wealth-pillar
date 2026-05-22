import { cn } from '@/lib';
import { stitchDashboardShell } from '@/styles/home-design-foundation';

const pageContainerStyles = {
  container: `relative flex w-full min-h-0 flex-col overflow-x-hidden ${stitchDashboardShell.pageBackground} pt-[64px]`,
} as const;

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: Readonly<PageContainerProps>) {
  return (
    <div className={cn(pageContainerStyles.container, className)} suppressHydrationWarning>
      {children}
    </div>
  );
}
