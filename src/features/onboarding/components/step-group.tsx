'use client';

import { Field, FieldLabel, Input } from '@/components/ui';
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
      <Field>
        <FieldLabel htmlFor="groupName">{t('fields.group.nameLabel')}</FieldLabel>
        <Input
          id="groupName"
          type="text"
          autoComplete="organization"
          placeholder={t('fields.group.namePlaceholder')}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          disabled={loading}
          className={onboardingStyles.input}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="groupDescription">{t('fields.group.descriptionLabel')}</FieldLabel>
        <Input
          id="groupDescription"
          type="text"
          placeholder={t('fields.group.descriptionPlaceholder')}
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          disabled={loading}
          className={onboardingStyles.input}
        />
      </Field>
    </div>
  );
}
