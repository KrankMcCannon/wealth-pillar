import { Skeleton } from '@/components/ui/skeleton';

export function SettingsHeaderSkeleton() {
  return null;
}

export function ProfileSectionSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </section>
  );
}

export function GroupManagementSectionSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </section>
  );
}

export function PreferencesSectionSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </section>
  );
}

export function SupportSectionSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </section>
  );
}

export function SettingsPageSkeleton() {
  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <ProfileSectionSkeleton />
      <GroupManagementSectionSkeleton />
      <PreferencesSectionSkeleton />
      <SupportSectionSkeleton />
    </main>
  );
}
