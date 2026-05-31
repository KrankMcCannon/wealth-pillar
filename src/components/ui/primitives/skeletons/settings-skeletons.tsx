import { BottomNavigation, PageContainer } from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { stitchSettings } from '@/styles/home-design-foundation';

function SettingsHeaderSkeleton() {
  return (
    <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
      <div className={headerStyles.inner}>
        <div className={headerStyles.slotLeft}>
          <Skeleton className="size-11 rounded-full" />
        </div>
        <div className={headerStyles.slotCenter}>
          <Skeleton className="h-5 w-28" />
        </div>
        <div className={headerStyles.slotRight}>
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
    </header>
  );
}

function ProfileSectionSkeleton() {
  return <Skeleton className="h-22 w-full rounded-2xl" aria-hidden />;
}

function SettingsSectionCardSkeleton({ rows }: Readonly<{ rows: number }>) {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="mx-2 h-3 w-24" aria-hidden />
      <div className={stitchSettings.sectionCard}>
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton
            key={i}
            className={cn('mx-4 h-14 rounded-lg', i < rows - 1 && 'border-b border-white/6')}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}

export function SettingsPageSkeleton() {
  return (
    <PageContainer aria-busy="true">
      <SettingsHeaderSkeleton />
      <main className={stitchSettings.pageMain}>
        <ProfileSectionSkeleton />
        <SettingsSectionCardSkeleton rows={2} />
        <SettingsSectionCardSkeleton rows={4} />
        <SettingsSectionCardSkeleton rows={2} />
        <Skeleton className="mt-3 h-12 w-full rounded-xl" aria-hidden />
      </main>
      <BottomNavigation />
    </PageContainer>
  );
}
