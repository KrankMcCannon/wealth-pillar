import { cn } from '@/lib';
import { pageContainerStyles } from './theme/page-container-styles';

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
