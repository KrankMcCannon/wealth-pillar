'use client';

import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import type { User } from '@/lib/types';

interface ProfileSectionProps {
  currentUser: User;
  userInitials: string;
  onEditProfile: () => void;
}

export function ProfileSection({
  currentUser,
  userInitials,
  onEditProfile,
}: Readonly<ProfileSectionProps>) {
  const t = useTranslations('SettingsSections.Profile');

  return (
    <section className={s.profileCard}>
      <div
        className={s.profileAvatar}
        style={currentUser.theme_color ? { backgroundColor: currentUser.theme_color } : undefined}
        role="img"
        aria-label={t('avatarAriaLabel', { name: currentUser.name ?? '' })}
      >
        <span aria-hidden>{userInitials}</span>
      </div>
      <div className={s.profileInfo}>
        <h2 className={s.profileName}>{currentUser.name ?? ''}</h2>
        <p className={s.profileEmail}>{currentUser.email ?? ''}</p>
      </div>
      <button type="button" className={s.editButton} onClick={onEditProfile}>
        {t('editButton')}
      </button>
    </section>
  );
}
