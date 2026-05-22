/**
 * Settings Skeleton Screens — Stitch dark palette
 */

import { stitchSettings as s } from '@/styles/home-design-foundation';

function Shimmer({ className }: Readonly<{ className: string }>) {
  return <div className={`${s.skeletonShimmer} ${className}`} />;
}

export function SettingsHeaderSkeleton() {
  return null;
}

export function ProfileSectionSkeleton() {
  return (
    <section className="space-y-2">
      <Shimmer className={s.skeletonEyebrow} />
      <Shimmer className={s.skeletonCard} />
    </section>
  );
}

export function GroupManagementSectionSkeleton() {
  return (
    <section className="space-y-2">
      <Shimmer className={s.skeletonEyebrow} />
      <Shimmer className={`${s.skeletonCard} h-32`} />
    </section>
  );
}

export function PreferencesSectionSkeleton() {
  return (
    <section className="space-y-2">
      <Shimmer className={s.skeletonEyebrow} />
      <div className="space-y-2">
        <Shimmer className={s.skeletonRow} />
        <Shimmer className={s.skeletonRow} />
        <Shimmer className={s.skeletonRow} />
        <Shimmer className={s.skeletonRow} />
      </div>
    </section>
  );
}

export function SupportSectionSkeleton() {
  return (
    <section className="space-y-2">
      <Shimmer className={s.skeletonEyebrow} />
      <Shimmer className={`${s.skeletonCard} h-28`} />
      <Shimmer className="h-12 w-full rounded-xl" />
    </section>
  );
}

export function SettingsPageSkeleton() {
  return (
    <main className={s.pageMain}>
      <ProfileSectionSkeleton />
      <GroupManagementSectionSkeleton />
      <PreferencesSectionSkeleton />
      <SupportSectionSkeleton />
    </main>
  );
}
