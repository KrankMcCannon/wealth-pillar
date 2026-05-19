'use client';

import { HelpCircle, PlusCircle, Star, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import type { AccountType } from '@/lib/types';
import type { OnboardingDraftAccount } from '@/features/onboarding/onboarding-draft-storage';
import { onboardingStyles } from '@/features/onboarding/styles';
import type { OnboardingWizardApi } from './use-onboarding-wizard';

export type OnboardingStepProfileProps = {
  t: OnboardingWizardApi['t'];
  loading: boolean;
  accounts: OnboardingDraftAccount[];
  accountTypeOptions: OnboardingWizardApi['accountTypeOptions'];
  accountTypeDescriptions: OnboardingWizardApi['accountTypeDescriptions'];
  updateAccountField: OnboardingWizardApi['updateAccountField'];
  setAccountAsDefault: OnboardingWizardApi['setAccountAsDefault'];
  addAccount: OnboardingWizardApi['addAccount'];
  removeAccount: OnboardingWizardApi['removeAccount'];
};

export function OnboardingStepProfile({
  t,
  loading,
  accounts,
  accountTypeOptions,
  accountTypeDescriptions,
  updateAccountField,
  setAccountAsDefault,
  addAccount,
  removeAccount,
}: Readonly<OnboardingStepProfileProps>) {
  return (
    <div className={onboardingStyles.form.section}>
      {accounts.length > 1 && (
        <div className={onboardingStyles.accounts.infoBanner}>
          <Label className={onboardingStyles.label}>{t('fields.accounts.defaultTitle')}</Label>
          <p className={onboardingStyles.accounts.infoText}>{t('fields.accounts.defaultInfo')}</p>
        </div>
      )}

      {accounts.map((account, index) => (
        <div key={account.id} className={onboardingStyles.card}>
          <div className={onboardingStyles.cardHeader}>
            <div className={onboardingStyles.accounts.labelRow}>
              <p className={onboardingStyles.cardTitle}>
                {t('fields.accounts.cardTitle', { index: index + 1 })}
              </p>

              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setAccountAsDefault(index)}
                  className={`${onboardingStyles.accounts.defaultToggle} ${
                    account.isDefault
                      ? onboardingStyles.accounts.defaultActive
                      : onboardingStyles.accounts.defaultInactive
                  }`}
                  title={
                    account.isDefault
                      ? t('fields.accounts.defaultAccountTitle')
                      : t('fields.accounts.setDefaultTitle')
                  }
                  disabled={loading}
                >
                  <Star
                    className={`${onboardingStyles.accounts.defaultIcon} ${account.isDefault ? onboardingStyles.accounts.defaultIconFilled : ''}`}
                  />
                </button>
              )}
            </div>

            {accounts.length > 1 && (
              <button
                type="button"
                onClick={() => removeAccount(index)}
                className={onboardingStyles.deleteButton}
                disabled={loading}
              >
                <Trash2 className={onboardingStyles.accounts.deleteIcon} />
              </button>
            )}
          </div>
          <div className={onboardingStyles.form.field}>
            <Label className={onboardingStyles.label}>{t('fields.accounts.nameLabel')}</Label>
            <Input
              value={account.name}
              onChange={(e) => updateAccountField(index, 'name', e.target.value)}
              placeholder={t('fields.accounts.namePlaceholder')}
              disabled={loading}
              className={onboardingStyles.input}
            />
          </div>
          <div className={onboardingStyles.form.field}>
            <div className={onboardingStyles.accounts.labelRow}>
              <Label className={onboardingStyles.label}>{t('fields.accounts.typeLabel')}</Label>
              <div className={onboardingStyles.accounts.helpGroup}>
                <HelpCircle className={onboardingStyles.accounts.helpIcon} />
                <div className={onboardingStyles.accounts.helpPopover}>
                  <p className={onboardingStyles.accounts.helpTitle}>
                    {t(`accountTypes.${account.type}.label`)}
                  </p>
                  <p className={onboardingStyles.accounts.helpBody}>
                    {accountTypeDescriptions[account.type]}
                  </p>
                </div>
              </div>
            </div>
            <Select
              value={account.type}
              onValueChange={(value) => updateAccountField(index, 'type', value as AccountType)}
              disabled={loading}
            >
              <SelectTrigger className={onboardingStyles.select}>
                <SelectValue placeholder={t('fields.accounts.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent className={onboardingStyles.selectContent}>
                {accountTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={onboardingStyles.accounts.typeDescription} aria-live="polite">
              {accountTypeDescriptions[account.type]}
            </p>
          </div>
        </div>
      ))}
      <Button
        type="button"
        onClick={addAccount}
        disabled={loading}
        className={onboardingStyles.addButton}
      >
        <PlusCircle className={onboardingStyles.accounts.addIcon} /> {t('buttons.addAccount')}
      </Button>
    </div>
  );
}
