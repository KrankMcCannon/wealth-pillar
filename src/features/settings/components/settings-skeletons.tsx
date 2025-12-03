/**
 * Settings Skeleton Screens
 * Progressive loading components for settings page
 * Uses shimmer animation for visual feedback
 */

import { SkeletonList } from "@/components/ui/primitives";

import { settingsStyles } from '../theme';

/**
 * Header skeleton for loading state
 */
export function SettingsHeaderSkeleton() {
  return (
    <header className={settingsStyles.header.container}>
      <div className={settingsStyles.header.inner}>
        <div className="w-10 h-10 bg-muted/50 rounded-xl animate-pulse"></div>
        <div className="w-24 h-6 bg-muted/50 rounded-lg animate-pulse"></div>
        <div className={settingsStyles.header.spacer}></div>
      </div>
    </header>
  );
}

/**
 * Profile section skeleton
 */
export function ProfileSectionSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-6 w-32 bg-muted/50 rounded-lg animate-pulse"></div>
      <div className="bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-2 py-4 bg-card">
          <div className="size-16 rounded-2xl bg-muted/50 shrink-0 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 w-24 bg-muted/50 rounded-lg animate-pulse"></div>
            <div className="h-4 w-32 bg-muted/50 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Details */}
        <SkeletonList
          count={3}
          spacing="divide-y divide-[#7678e4]/8"
          renderItem={() => (
            <div className="flex items-center gap-3 p-3">
              <div className="size-10 bg-muted/50 rounded-xl shrink-0 animate-pulse"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 w-16 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-muted/50 rounded animate-pulse"></div>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}

/**
 * Group management section skeleton
 */
export function GroupManagementSectionSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-6 w-40 bg-muted/50 rounded-lg animate-pulse"></div>

      {/* Members list */}
      <div className="bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 bg-card space-y-2">
          <div className="h-4 w-32 bg-muted/50 rounded animate-pulse"></div>
          <div className="h-3 w-24 bg-muted/50 rounded animate-pulse"></div>
        </div>
        <SkeletonList
          count={3}
          spacing="divide-y divide-[#7678e4]/8"
          renderItem={() => (
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-muted/50 rounded-xl shrink-0 animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-muted/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Actions */}
      <div className="bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
        <SkeletonList
          count={3}
          spacing="divide-y divide-[#7678e4]/10"
          renderItem={() => (
            <div className="flex items-center gap-3 p-3">
              <div className="size-10 bg-muted/50 rounded-xl shrink-0 animate-pulse"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-3 w-40 bg-muted/50 rounded animate-pulse"></div>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}

/**
 * Preferences section skeleton
 */
export function PreferencesSectionSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-6 w-24 bg-muted/50 rounded-lg animate-pulse"></div>
      <div className="bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
        <SkeletonList
          count={3}
          spacing="divide-y divide-[#7678e4]/8"
          renderItem={() => (
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="size-10 bg-muted/50 rounded-xl shrink-0 animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-20 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-muted/50 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-16 h-8 bg-muted/50 rounded-full shrink-0 animate-pulse"></div>
            </div>
          )}
        />
      </div>
    </section>
  );
}

/**
 * Complete settings page skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div className={settingsStyles.page.container} style={settingsStyles.page.style}>
      <SettingsHeaderSkeleton />
      <main className={settingsStyles.main.container}>
        <ProfileSectionSkeleton />
        <GroupManagementSectionSkeleton />
        <PreferencesSectionSkeleton />
      </main>
    </div>
  );
}
