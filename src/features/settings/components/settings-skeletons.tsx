/**
 * Settings Skeleton Screens
 * Progressive loading components for settings page
 * Uses shimmer animation for visual feedback
 */

import { SkeletonList } from '@/components/ui/primitives';

import { settingsStyles } from '@/features/settings/theme';

/**
 * Header skeleton for loading state
 */
export function SettingsHeaderSkeleton() {
  return (
    <header className={settingsStyles.header.container}>
      <div className={settingsStyles.header.inner}>
        <div
          className={`${settingsStyles.skeletons.headerIcon} ${settingsStyles.skeletons.shimmer}`}
        />
        <div
          className={`${settingsStyles.skeletons.headerTitle} ${settingsStyles.skeletons.shimmer}`}
        />
        <div className={settingsStyles.header.spacer} />
      </div>
    </header>
  );
}

/**
 * Profile section skeleton
 */
export function ProfileSectionSkeleton() {
  return (
    <section className={settingsStyles.skeletons.section}>
      <div className={settingsStyles.skeletons.sectionTitle} />
      <div className={settingsStyles.skeletons.card}>
        {/* Header */}
        <div className={settingsStyles.skeletons.cardHeader}>
          <div className={settingsStyles.skeletons.avatar} />
          <div className={settingsStyles.skeletons.headerBody}>
            <div className={settingsStyles.skeletons.headerLinePrimary} />
            <div className={settingsStyles.skeletons.headerLineSecondary} />
          </div>
        </div>

        {/* Details */}
        <SkeletonList
          count={3}
          spacing={settingsStyles.skeletons.dividerLight}
          renderItem={() => (
            <div className={settingsStyles.skeletons.listRow}>
              <div className={settingsStyles.skeletons.listIcon} />
              <div className={settingsStyles.skeletons.listBody}>
                <div className={settingsStyles.skeletons.listLineShort} />
                <div className={settingsStyles.skeletons.listLineMedium} />
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
    <section className={settingsStyles.skeletons.section}>
      <div className={settingsStyles.skeletons.sectionTitle} />

      {/* Members list */}
      <div className={`${settingsStyles.skeletons.card} ${settingsStyles.skeletons.cardMargin}`}>
        <div className={settingsStyles.skeletons.cardHeaderCompact}>
          <div className={settingsStyles.skeletons.headerLineSmall} />
          <div className={settingsStyles.skeletons.headerLineTiny} />
        </div>
        <SkeletonList
          count={3}
          spacing={settingsStyles.skeletons.dividerLight}
          renderItem={() => (
            <div className={settingsStyles.skeletons.memberRow}>
              <div className={settingsStyles.skeletons.memberLeft}>
                <div className={settingsStyles.skeletons.memberIcon} />
                <div className={settingsStyles.skeletons.memberBody}>
                  <div className={settingsStyles.skeletons.listLineShort} />
                  <div className={settingsStyles.skeletons.listLineLong} />
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Actions */}
      <div className={settingsStyles.skeletons.card}>
        <SkeletonList
          count={3}
          spacing={settingsStyles.skeletons.dividerStrong}
          renderItem={() => (
            <div className={settingsStyles.skeletons.listRow}>
              <div className={settingsStyles.skeletons.listIcon} />
              <div className={settingsStyles.skeletons.listBody}>
                <div className={settingsStyles.skeletons.listLineXL} />
                <div className={settingsStyles.skeletons.listLineXLLong} />
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
    <section className={settingsStyles.skeletons.section}>
      <div className={settingsStyles.skeletons.sectionTitle} />
      <div className={settingsStyles.skeletons.card}>
        <SkeletonList
          count={3}
          spacing={settingsStyles.skeletons.dividerLight}
          renderItem={() => (
            <div className={settingsStyles.skeletons.listRowSpace}>
              <div className={settingsStyles.skeletons.memberLeft}>
                <div className={settingsStyles.skeletons.listIcon} />
                <div className={settingsStyles.skeletons.listBody}>
                  <div className={settingsStyles.skeletons.listLineXL} />
                  <div className={settingsStyles.skeletons.listLineShort} />
                </div>
              </div>
              <div className={settingsStyles.skeletons.switchPill} />
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
    <div className={settingsStyles.page.container}>
      <SettingsHeaderSkeleton />
      <main className={settingsStyles.main.container}>
        <ProfileSectionSkeleton />
        <GroupManagementSectionSkeleton />
        <PreferencesSectionSkeleton />
      </main>
    </div>
  );
}
