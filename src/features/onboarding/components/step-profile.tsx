'use client';

import { PlusCircle, Star, Trash2 } from 'lucide-react';
import { Button, Field, FieldLabel, Input } from '@/components/ui';
import { ChoiceRadios } from '@/components/form/modal-fields';
import type { AccountType } from '@/lib/types';
import type { OnboardingFormAccount } from '@/features/onboarding/types';
import { onboardingStyles } from '@/features/onboarding/styles';
import type { OnboardingWizardApi } from './use-onboarding-wizard';

export type OnboardingStepProfileProps = {
  t: OnboardingWizardApi['t'];
  loading: boolean;
  accounts: OnboardingFormAccount[];
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
          <p className={onboardingStyles.label}>{t('fields.accounts.defaultTitle')}</p>
          <p className={onboardingStyles.accounts.infoText}>{t('fields.accounts.defaultInfo')}</p>
        </div>
      )}

      {accounts.map((account, index) => {
        const nameId = `account-name-${account.id}`;
        return (
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
                    aria-pressed={account.isDefault}
                    aria-label={
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
                  aria-label={t('fields.accounts.cardTitle', { index: index + 1 })}
                  disabled={loading}
                >
                  <Trash2 className={onboardingStyles.accounts.deleteIcon} />
                </button>
              )}
            </div>
            <Field>
              <FieldLabel htmlFor={nameId}>{t('fields.accounts.nameLabel')}</FieldLabel>
              <Input
                id={nameId}
                value={account.name}
                onChange={(e) => updateAccountField(index, 'name', e.target.value)}
                placeholder={t('fields.accounts.namePlaceholder')}
                disabled={loading}
                className={onboardingStyles.input}
              />
            </Field>
            <ChoiceRadios
              name={`account-type-${account.id}`}
              value={account.type}
              onChange={(value) => updateAccountField(index, 'type', value as AccountType)}
              label={t('fields.accounts.typeLabel')}
              variant="cards"
              padded={false}
              disabled={loading}
              options={accountTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
                description: accountTypeDescriptions[option.value],
              }))}
            />
          </div>
        );
      })}
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
