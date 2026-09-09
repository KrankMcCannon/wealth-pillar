import Link from 'next/link';
import it from '@/messages/it.json';
import { RouteEmptyState } from '@/components/shared/route-empty-state';
import { stitchSurface } from '@/styles/home-design-foundation';

export default function NotFound() {
  const t = it.NotFound;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-4">
      <RouteEmptyState title={t.title} description={t.description} role="status">
        <Link href="/it/home" className={stitchSurface.primaryCta}>
          {t.home}
        </Link>
      </RouteEmptyState>
    </div>
  );
}
