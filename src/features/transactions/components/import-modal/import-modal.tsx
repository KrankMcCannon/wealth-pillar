'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ModalWrapper,
  ModalBody,
  ModalFooter,
  ModalSection,
  Button,
  Spinner,
} from '@/components/ui';
import { ModalSelectField } from '@/components/form';
import { useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import {
  useRequiredCurrentUser,
  useRequiredGroupId,
  useRequiredGroupUsers,
} from '@/hooks/use-required-user';
import { useToast } from '@/hooks';
import {
  assignImportHashes,
  matchCategoryHint,
  parseImportFile,
  type ParseImportFileResult,
  type BulkImportResult,
} from '@/lib/import';
import {
  commitImportAction,
  prepareImportAction,
} from '@/features/transactions/actions/import-actions';
import { toSelectOptions, sortSelectOptions } from '@/components/form/form-select';
import { getDefaultAccountIdForUser } from '@/features/accounts/utils/default-account-id';
import type { Account, User } from '@/lib/types';
import { ImportPreviewRow, type PreviewRow } from './import-preview-row';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'result';

type ProductMappingForm = Record<string, string>;

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Estimated collapsed row height (px) used before the virtualizer measures the real element. */
const PREVIEW_ROW_ESTIMATED_SIZE = 196;

function mappingUserField(productKey: string): string {
  return `user_${productKey}`;
}

function mappingAccountField(productKey: string): string {
  return `account_${productKey}`;
}

interface GroupMappingFieldsProps {
  productKey: string;
  productLabel: string;
  rowsCount: number;
  excludedCount: number;
  control: Control<ProductMappingForm>;
  setValue: UseFormSetValue<ProductMappingForm>;
  accounts: Account[];
  groupUsers: User[];
  userOptions: Array<{ value: string; label: string }>;
  t: ReturnType<typeof useTranslations<'Transactions.ImportModal'>>;
}

function GroupMappingFields({
  productKey,
  productLabel,
  rowsCount,
  excludedCount,
  control,
  setValue,
  accounts,
  groupUsers,
  userOptions,
  t,
}: Readonly<GroupMappingFieldsProps>) {
  const userField = mappingUserField(productKey);
  const accountField = mappingAccountField(productKey);
  const userId = useWatch({ control, name: userField });
  const accountId = useWatch({ control, name: accountField });

  const userAccounts = useMemo(
    () => accounts.filter((account) => account.user_ids?.includes(userId)),
    [accounts, userId]
  );

  const accountOptions = useMemo(
    () => [
      { value: '__exclude__', label: t('mapping.excludeProduct') },
      ...sortSelectOptions(
        toSelectOptions(
          userAccounts,
          (account) => account.id,
          (account) => account.name
        )
      ),
    ],
    [t, userAccounts]
  );

  useEffect(() => {
    if (!accountId || accountId === '__exclude__') return;
    if (userAccounts.some((account) => account.id === accountId)) return;
    setValue(
      accountField,
      getDefaultAccountIdForUser(userId, accounts, groupUsers) || '__exclude__'
    );
  }, [accountField, accountId, accounts, groupUsers, setValue, userAccounts, userId]);

  return (
    <>
      <ModalSelectField
        control={control}
        name={userField}
        label={t('mapping.userForProduct', { product: productLabel })}
        options={userOptions}
      />
      <ModalSelectField
        control={control}
        name={accountField}
        label={t('mapping.accountForProduct', { product: productLabel })}
        options={accountOptions}
        hint={t('mapping.rowsCount', {
          count: rowsCount,
          excluded: excludedCount,
        })}
      />
    </>
  );
}

export default function ImportModal({ isOpen, onClose }: Readonly<ImportModalProps>) {
  const t = useTranslations('Transactions.ImportModal');
  const currentUser = useRequiredCurrentUser();
  const groupId = useRequiredGroupId();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const { toast } = useToast();

  const [step, setStep] = useState<ImportStep>('upload');
  const [parseResult, setParseResult] = useState<ParseImportFileResult | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const defaultUserId = currentUser.id;
  const defaultAccountId =
    getDefaultAccountIdForUser(defaultUserId, accounts, groupUsers) || accounts[0]?.id || '';

  const mappingForm = useForm<ProductMappingForm>({
    defaultValues: {},
  });

  const userOptions = useMemo(
    () => sortSelectOptions(groupUsers.map((user) => ({ value: user.id, label: user.name ?? '' }))),
    [groupUsers]
  );

  const resetState = useCallback(() => {
    setStep('upload');
    setParseResult(null);
    setPreviewRows([]);
    setResult(null);
    setIsBusy(false);
    setFileName('');
    mappingForm.reset({});
  }, [mappingForm]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      setIsBusy(true);
      setFileName(file.name);
      try {
        const parsed = await parseImportFile(file);
        setParseResult(parsed);
        const defaults: ProductMappingForm = {};
        for (const group of parsed.groups) {
          defaults[mappingUserField(group.productKey)] = defaultUserId;
          defaults[mappingAccountField(group.productKey)] = defaultAccountId;
        }
        mappingForm.reset(defaults);
        setStep('mapping');
      } catch (error) {
        toast({
          title: t('errors.parseFailed'),
          description: error instanceof Error ? error.message : t('errors.generic'),
          variant: 'destructive',
        });
      } finally {
        setIsBusy(false);
      }
    },
    [defaultAccountId, defaultUserId, mappingForm, t, toast]
  );

  const handlePrepare = mappingForm.handleSubmit(async (values) => {
    if (!parseResult) return;
    setIsBusy(true);
    try {
      const preparedInputs = [];
      const userByRowId = new Map<string, string>();
      const categoryHintByRowId = new Map<string, string | undefined>();

      for (const group of parseResult.groups) {
        const accountId = values[mappingAccountField(group.productKey)];
        const userId = values[mappingUserField(group.productKey)];
        if (!accountId || accountId === '__exclude__' || !userId) continue;

        const withHashes = await assignImportHashes(group.rows, accountId);
        for (const row of withHashes) {
          if (row.amount <= 0) continue;
          userByRowId.set(row.rowId, userId);
          categoryHintByRowId.set(row.rowId, row.categoryHint);
          preparedInputs.push({
            rowId: row.rowId,
            account_id: accountId,
            date: row.date,
            description: row.description,
            amount: row.amount,
            type: row.type,
            import_hash: row.import_hash,
            ...(row.rawSource.causale ? { causale: row.rawSource.causale } : {}),
          });
        }
      }

      if (preparedInputs.length === 0) {
        toast({ title: t('errors.noRows'), variant: 'destructive' });
        return;
      }

      const response = await prepareImportAction({
        group_id: groupId,
        rows: preparedInputs,
      });

      if (response.error || !response.data) {
        toast({
          title: t('errors.prepareFailed'),
          description: response.error ?? '',
          variant: 'destructive',
        });
        return;
      }

      setPreviewRows(
        response.data.map((row) => ({
          ...row,
          include: row.includeByDefault,
          category:
            matchCategoryHint(categoryHintByRowId.get(row.rowId), categories) ??
            row.suggestedCategory,
          user_id: userByRowId.get(row.rowId) ?? defaultUserId,
        }))
      );
      setStep('preview');
    } catch (error) {
      toast({
        title: t('errors.prepareFailed'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  });

  const handleCommit = useCallback(async () => {
    const selected = previewRows.filter((row) => row.include);
    if (selected.length === 0) {
      toast({ title: t('errors.noRowsSelected'), variant: 'destructive' });
      return;
    }

    setIsBusy(true);
    try {
      const response = await commitImportAction({
        group_id: groupId,
        rows: selected.map((row) => ({
          rowId: row.rowId,
          account_id: row.account_id,
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          import_hash: row.import_hash,
          category: row.category,
          user_id: row.user_id,
          ...(row.suggestedRecurringSeriesId
            ? { recurring_series_id: row.suggestedRecurringSeriesId }
            : {}),
        })),
      });

      if (response.error || !response.data) {
        toast({
          title: t('errors.commitFailed'),
          description: response.error ?? '',
          variant: 'destructive',
        });
        return;
      }

      setResult(response.data);
      setStep('result');
    } catch (error) {
      toast({
        title: t('errors.commitFailed'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  }, [groupId, previewRows, t, toast]);

  // Referential equality of unchanged rows is preserved by these updaters (see ImportPreviewRow),
  // which keeps the virtualized list from re-rendering rows the user didn't touch.
  const handleToggleInclude = useCallback((rowId: string, checked: boolean) => {
    setPreviewRows((current) =>
      current.map((item) => (item.rowId === rowId ? { ...item, include: checked } : item))
    );
  }, []);

  const handleCategoryChange = useCallback((rowId: string, category: string) => {
    setPreviewRows((current) =>
      current.map((item) => (item.rowId === rowId ? { ...item, category } : item))
    );
  }, []);

  const includedCount = useMemo(
    () => previewRows.filter((row) => row.include).length,
    [previewRows]
  );

  const rowVirtualizer = useVirtualizer({
    count: previewRows.length,
    getScrollElement: () => previewScrollRef.current,
    estimateSize: () => PREVIEW_ROW_ESTIMATED_SIZE,
    overscan: 8,
  });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      title={t('title')}
      isLoading={isBusy && step === 'upload'}
      disableOutsideClose={isBusy}
    >
      <ModalBody>
        {step === 'upload' ? (
          <ModalSection title={t('upload.title')}>
            <label
              htmlFor="import-file-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 p-8 text-center"
            >
              <Upload className="size-8 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">{t('upload.cta')}</span>
              <span className="text-xs text-muted-foreground">{t('upload.hint')}</span>
              <input
                id="import-file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </ModalSection>
        ) : null}

        {step === 'mapping' && parseResult ? (
          <form className="flex flex-col gap-4" onSubmit={handlePrepare}>
            <p className="text-sm text-muted-foreground">
              {t('mapping.fileLabel', { file: fileName, format: parseResult.format })}
            </p>
            {parseResult.groups.map((group) => (
              <GroupMappingFields
                key={group.productKey}
                productKey={group.productKey}
                productLabel={group.productLabel}
                rowsCount={group.rows.length}
                excludedCount={group.excludedCount}
                control={mappingForm.control}
                setValue={mappingForm.setValue}
                accounts={accounts}
                groupUsers={groupUsers}
                userOptions={userOptions}
                t={t}
              />
            ))}
          </form>
        ) : null}

        {step === 'preview' ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t('preview.summary', { included: includedCount, total: previewRows.length })}
            </p>
            <div ref={previewScrollRef} className="max-h-[50vh] overflow-y-auto pr-1">
              <div
                style={{
                  height: rowVirtualizer.getTotalSize(),
                  position: 'relative',
                  width: '100%',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = previewRows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <div
                      key={row.rowId}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className="absolute left-0 top-0 w-full pb-2"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <ImportPreviewRow
                        row={row}
                        categories={categories}
                        t={t}
                        onToggleInclude={handleToggleInclude}
                        onCategoryChange={handleCategoryChange}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 'result' && result ? (
          <div className="space-y-2 text-sm">
            <p>{t('result.inserted', { count: result.inserted })}</p>
            <p className="text-muted-foreground">
              {t('result.skipped', { count: result.skipped })}
            </p>
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter>
        {step === 'mapping' ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('upload')}
              disabled={isBusy}
            >
              {t('actions.back')}
            </Button>
            <Button type="button" onClick={handlePrepare} disabled={isBusy}>
              {isBusy ? <Spinner className="size-4" /> : t('actions.continue')}
            </Button>
          </>
        ) : null}
        {step === 'preview' ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('mapping')}
              disabled={isBusy}
            >
              {t('actions.back')}
            </Button>
            <Button type="button" onClick={handleCommit} disabled={isBusy || includedCount === 0}>
              {isBusy ? (
                <Spinner className="size-4" />
              ) : (
                t('actions.import', { count: includedCount })
              )}
            </Button>
          </>
        ) : null}
        {step === 'result' ? (
          <Button type="button" onClick={handleClose}>
            {t('actions.done')}
          </Button>
        ) : null}
      </ModalFooter>
    </ModalWrapper>
  );
}
