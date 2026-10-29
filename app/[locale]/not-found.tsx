import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { HomeDashboardMain } from '@/components/layout';
import { RouteEmptyState } from '@/components/shared/route-empty-state';
import { stitchSurface } from '@/styles/home-design-foundation';

export default async function LocaleNotFound() {
  const t = await getTranslations('NotFound');

  return (
    <HomeDashboardMain id="main-not-found">
      <RouteEmptyState title={t('title')} description={t('description')} role="status">
        <Link href="/home" className={stitchSurface.primaryCta}>
          {t('home')}
        </Link>
      </RouteEmptyState>
    </HomeDashboardMain>
  );
}
