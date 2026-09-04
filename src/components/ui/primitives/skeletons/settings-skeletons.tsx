import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { stitchSettings } from '@/styles/home-design-foundation';

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
    <main className={stitchSettings.pageMain} aria-busy="true">
      <ProfileSectionSkeleton />
      <SettingsSectionCardSkeleton rows={2} />
      <SettingsSectionCardSkeleton rows={4} />
      <SettingsSectionCardSkeleton rows={2} />
      <Skeleton className="mt-3 h-12 w-full rounded-xl" aria-hidden />
    </main>
  );
}
