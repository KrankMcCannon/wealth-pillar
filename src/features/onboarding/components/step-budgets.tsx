'use client';

import { HelpCircle, PlusCircle, Trash2 } from 'lucide-react';
import {
  Button,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ChoiceRadios } from '@/components/form/modal-fields';
import type { BudgetType, Category } from '@/lib/types';
import type { OnboardingFormBudget } from '@/features/onboarding/types';
import { onboardingStyles } from '@/features/onboarding/styles';
import type { OnboardingWizardApi } from './use-onboarding-wizard';

export type OnboardingStepBudgetsProps = {
  t: OnboardingWizardApi['t'];
  loading: boolean;
  categories: Category[];
  budgets: OnboardingFormBudget[];
  budgetStartDay: number;
  setBudgetStartDay: (value: number) => void;
  budgetTypeOptions: OnboardingWizardApi['budgetTypeOptions'];
  categoryOptions: OnboardingWizardApi['categoryOptions'];
  updateBudgetField: OnboardingWizardApi['updateBudgetField'];
  addBudget: OnboardingWizardApi['addBudget'];
  removeBudget: OnboardingWizardApi['removeBudget'];
  handleSkipBudgets: OnboardingWizardApi['handleSkipBudgets'];
};

export function OnboardingStepBudgets({
  t,
  loading,
  categories,
  budgets,
  budgetStartDay,
  setBudgetStartDay,
  budgetTypeOptions,
  categoryOptions,
  updateBudgetField,
  addBudget,
  removeBudget,
  handleSkipBudgets,
}: Readonly<OnboardingStepBudgetsProps>) {
  return (
    <div className={onboardingStyles.form.section}>
      <div className={onboardingStyles.budgets.infoBanner}>
        <div className={onboardingStyles.budgets.infoRow}>
          <div className={onboardingStyles.budgets.infoContent}>
            <HelpCircle className={onboardingStyles.budgets.infoIcon} aria-hidden />
            <div className={onboardingStyles.budgets.infoBody}>
              <p className={onboardingStyles.budgets.infoTitle}>{t('fields.budgets.skipTitle')}</p>
              <p className={onboardingStyles.budgets.infoText}>{t('fields.budgets.skipInfo')}</p>
            </div>
          </div>
          {budgets.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSkipBudgets}
              disabled={loading}
              className={onboardingStyles.budgets.skipButton}
            >
              {t('buttons.skip')}
            </Button>
          )}
        </div>
      </div>

      {categories.length === 0 && (
        <div className={onboardingStyles.warningMessage}>{t('categories.noneAvailable')}</div>
      )}
      {budgets.map((budget, index) => {
        const descriptionId = `budget-description-${budget.id}`;
        const amountId = `budget-amount-${budget.id}`;
        const categoryId = `budget-category-${budget.id}`;
        return (
          <div key={budget.id} className={onboardingStyles.card}>
            <div className={onboardingStyles.cardHeader}>
              <p className={onboardingStyles.cardTitle}>
                {t('fields.budgets.cardTitle', { index: index + 1 })}
              </p>
              {budgets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBudget(index)}
                  className={onboardingStyles.deleteButton}
                  aria-label={t('fields.budgets.cardTitle', { index: index + 1 })}
                  disabled={loading}
                >
                  <Trash2 className={onboardingStyles.budgets.deleteIcon} />
                </button>
              )}
            </div>
            <Field>
              <FieldLabel htmlFor={descriptionId}>{t('fields.budgets.descriptionLabel')}</FieldLabel>
              <Input
                id={descriptionId}
                value={budget.description}
                onChange={(e) => updateBudgetField(index, 'description', e.target.value)}
                placeholder={t('fields.budgets.descriptionPlaceholder')}
                disabled={loading}
                className={onboardingStyles.input}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={amountId}>{t('fields.budgets.amountLabel')}</FieldLabel>
              <Input
                id={amountId}
                type="text"
                inputMode="decimal"
                value={budget.amount}
                onChange={(e) => updateBudgetField(index, 'amount', e.target.value)}
                placeholder={t('fields.budgets.amountPlaceholder')}
                disabled={loading}
                className={onboardingStyles.input}
              />
            </Field>
            <ChoiceRadios
              name={`budget-type-${budget.id}`}
              value={budget.type}
              onChange={(value) => updateBudgetField(index, 'type', value as BudgetType)}
              label={t('fields.budgets.periodLabel')}
              padded={false}
              disabled={loading}
              options={budgetTypeOptions}
            />
            <Field>
              <FieldLabel htmlFor={categoryId}>{t('fields.budgets.categoryLabel')}</FieldLabel>
              <Select
                value={budget.categoryId}
                onValueChange={(value) => updateBudgetField(index, 'categoryId', value)}
                disabled={loading}
              >
                <SelectTrigger id={categoryId} className={onboardingStyles.select}>
                  <SelectValue
                    placeholder={
                      categoryOptions.length
                        ? t('fields.budgets.categoryPlaceholder')
                        : t('fields.budgets.categoryUnavailable')
                    }
                  />
                </SelectTrigger>
                <SelectContent className={onboardingStyles.selectContent}>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        );
      })}
      <div className={onboardingStyles.budgets.startDay}>
        <FieldLabel htmlFor="budgetStartDay">{t('fields.budgets.startDayLabel')}</FieldLabel>
        <Select
          value={budgetStartDay.toString()}
          onValueChange={(value) => setBudgetStartDay(Number.parseInt(value, 10))}
          disabled={loading}
        >
          <SelectTrigger id="budgetStartDay" className={onboardingStyles.select}>
            <SelectValue placeholder={t('fields.budgets.startDayPlaceholder')} />
          </SelectTrigger>
          <SelectContent className={onboardingStyles.selectContent}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        onClick={addBudget}
        disabled={loading || categories.length === 0}
        className={onboardingStyles.addButton}
      >
        <PlusCircle className={onboardingStyles.budgets.addIcon} /> {t('buttons.addBudget')}
      </Button>
    </div>
  );
}
