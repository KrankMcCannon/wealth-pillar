'use client';

import { useFinancialCommand } from '@/hooks/use-financial-command';

import { withDeadline } from '@/lib/utils/with-deadline';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { EntityFormModal, EntityFormFooter } from '@/components/form';
import { useAccounts, useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import {
  TransactionFormFields,
  type TransactionFormData,
} from '@/features/transactions/components/transaction-form-fields';
import { createTransactionFormSchema } from '@/features/transactions/utils/transaction-form-schema';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import { financialDateKey } from '@/lib/utils/financial-date';
import { manualNotificationSchema } from '@/lib/bank-notifications/review';
import type { User } from '@/lib/types';
import { reviewBankNotificationAction, type getBankEventsAction } from './actions';

type Event = NonNullable<Awaited<ReturnType<typeof getBankEventsAction>>['data']>['events'][number];
export function CompleteNotificationModal({
  event,
  user,
  onClose,
  onComplete,
}: {
  event: Event;
  user: User;
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const financialCommand = useFinancialCommand();

  const t = useTranslations('BankNotifications');
  const tForm = useTranslations('Transactions.FormModal');
  const accounts = useAccounts().filter((account) => account.id === event.account_id);
  const categories = useCategories();
  const schema = useMemo(
    () =>
      createTransactionFormSchema(tForm).superRefine((values, context) => {
        const result = manualNotificationSchema.safeParse({
          description: values.description,
          amount: parseDecimal(values.amount),
          type: values.type,
          date: values.date,
        });
        if (!result.success)
          for (const issue of result.error.issues)
            context.addIssue({
              code: 'custom',
              path: issue.path,
              message: t('errors.invalid_details'),
            });
      }),
    [tForm, t]
  );
  const defaults = useMemo(
    () => ({
      description: event.parsed?.description ?? event.payload?.title ?? '',
      amount: event.parsed?.amount ?? '',
      ...(event.parsed ? { type: event.parsed.type } : {}),
      category: event.category ?? '',
      date:
        event.parsed?.date ??
        (event.payload?.occurredAt ? financialDateKey(event.payload.occurredAt) : ''),
      user_id: user.id,
      account_id: event.account_id,
      to_account_id: '',
    }),
    [event, user.id]
  );
  return (
    <EntityFormModal<TransactionFormData>
      isOpen
      onClose={onClose}
      title={t('complete')}
      wrapperProps={{ nested: true }}
      schema={schema}
      defaultValues={defaults}
      onSubmit={async (values, form, signal) => {
        try {
          const result = await withDeadline(
            financialCommand(
              'reviewBankNotificationAction',
              [
                {
                  id: event.id,
                  decision: 'import',
                  category: values.category,
                  manual: {
                    description: values.description,
                    amount: parseDecimal(values.amount),
                    type: values.type,
                    date: values.date,
                  },
                },
              ],
              (operationId, args) => reviewBankNotificationAction(...args, operationId)
            )
          );
          if (result.error) {
            form.setError('root', { message: t('errors.unavailable') });
            return;
          }
          if (result.data)
            useReferenceDataStore
              .getState()
              .finishBalanceMutation(`notification:${event.id}`, result.data);
          await withDeadline(onComplete());
          if (!signal?.aborted) onClose();
        } catch {
          form.setError('root', { message: t('errors.unavailable') });
        }
      }}
      footer={(_form, isSubmitting) => (
        <EntityFormFooter
          isSubmitting={isSubmitting}
          submitLabel={t('import')}
          onCancel={onClose}
        />
      )}
    >
      {(form) => (
        <TransactionFormFields
          form={form}
          groupUsers={[user]}
          categories={categories}
          filteredAccounts={accounts}
          destinationAccounts={[]}
          shouldDisableUserField
          isSubmitting={form.formState.isSubmitting}
          allowTransfers={false}
          accountDisabled
        />
      )}
    </EntityFormModal>
  );
}
