import { cn } from '@/lib';
import { stitchDashboardShell } from '@/styles/home-design-foundation';

const pageContainerStyles = {
  container: `relative flex min-h-dvh w-full flex-col ${stitchDashboardShell.pageBackground} pt-[var(--app-header-height)]`,
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
