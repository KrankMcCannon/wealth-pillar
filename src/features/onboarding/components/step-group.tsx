'use client';

import { Input, Label } from '@/components/ui';
import { onboardingStyles } from '@/features/onboarding/styles';
import type { OnboardingWizardApi } from './use-onboarding-wizard';

export type OnboardingStepGroupProps = {
  t: OnboardingWizardApi['t'];
  loading: boolean;
  groupName: string;
  setGroupName: (value: string) => void;
  groupDescription: string;
  setGroupDescription: (value: string) => void;
};

export function OnboardingStepGroup({
  t,
  loading,
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
}: Readonly<OnboardingStepGroupProps>) {
  return (
    <div className={onboardingStyles.form.section}>
      <div className={onboardingStyles.form.field}>
        <Label htmlFor="groupName" className={onboardingStyles.primaryLabel}>
          {t('fields.group.nameLabel')}
        </Label>
        <Input
          id="groupName"
          type="text"
          placeholder={t('fields.group.namePlaceholder')}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          disabled={loading}
          className={onboardingStyles.input}
        />
      </div>
      <div className={onboardingStyles.form.field}>
        <Label htmlFor="groupDescription" className={onboardingStyles.primaryLabel}>
          {t('fields.group.descriptionLabel')}
        </Label>
        <Input
          id="groupDescription"
          type="text"
          placeholder={t('fields.group.descriptionPlaceholder')}
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          disabled={loading}
          className={onboardingStyles.input}
        />
      </div>
    </div>
  );
}
