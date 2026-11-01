'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Upload } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { CategorySelect } from '@/components/form/category-select';
import { CompactSegments } from '../filter-dock';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import {
  restorePreviewChoices,
  setPreviewSelection,
  summarizeImportSelection,
  IMPORT_PREVIEW_PAGE_SIZE,
} from '../../utils/import-preview-state';
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
  const locale = useLocale();
  const router = useRouter();
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
  const [previewStatus, setPreviewStatus] = useState('all');
  const [previewPage, setPreviewPage] = useState(0);
  const previewHeadingRef = useRef<HTMLParagraphElement>(null);
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
    setPreviewStatus('all');
    setPreviewPage(0);
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
        setPreviewRows([]);
        setPreviewPage(0);
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

        for (const row of group.rows) {
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

      const preparedRows: PreviewRow[] = response.data.map((row) => ({
        ...row,
        include: row.includeByDefault,
        category:
          matchCategoryHint(categoryHintByRowId.get(row.rowId), categories) ??
          row.suggestedCategory,
        user_id: userByRowId.get(row.rowId) ?? defaultUserId,
      }));
      setPreviewRows((previous) =>
        restorePreviewChoices(
          preparedRows,
          previous,
          new Set(categories.map((category) => category.key))
        )
      );
      setPreviewPage(0);
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
          occurrence_index: row.occurrence_index,
          preparation_token: row.preparation_token,
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
      router.refresh();
    } catch (error) {
      toast({
        title: t('errors.commitFailed'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  }, [groupId, previewRows, router, t, toast]);

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

  const filteredPreview = useMemo(
    () => previewRows.filter((row) => previewStatus === 'all' || row.status === previewStatus),
    [previewRows, previewStatus]
  );
  const pageCount = Math.max(1, Math.ceil(filteredPreview.length / IMPORT_PREVIEW_PAGE_SIZE));
  const safePage = Math.min(previewPage, pageCount - 1);
  const pageRows = filteredPreview.slice(
    safePage * IMPORT_PREVIEW_PAGE_SIZE,
    (safePage + 1) * IMPORT_PREVIEW_PAGE_SIZE
  );
  const summaries = useMemo(() => summarizeImportSelection(previewRows), [previewRows]);
  function changePreviewPage(page: number) {
    setPreviewPage(page);
    previewScrollRef.current?.scrollTo({ top: 0 });
    previewHeadingRef.current?.focus();
  }

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
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 p-8 text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
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
          <div className="flex min-w-0 flex-col gap-3">
            <p
              ref={previewHeadingRef}
              tabIndex={-1}
              className="text-sm text-muted-foreground"
              role="status"
            >
              {t('preview.summary', { included: includedCount, total: previewRows.length })}
            </p>
            <CompactSegments
              ariaLabel={t('preview.filterStatus')}
              selected={previewStatus}
              onSelect={(status) => {
                setPreviewStatus(status);
                changePreviewPage(0);
              }}
              options={['all', 'new', 'possible-duplicate', 'duplicate', 'excluded'].map(
                (status) => ({
                  key: status,
                  label: status === 'all' ? t('preview.allRows') : t(`status.${status}`),
                  count:
                    status === 'all'
                      ? previewRows.length
                      : previewRows.filter((row) => row.status === status).length,
                })
              )}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setPreviewRows((rows) =>
                    setPreviewSelection(
                      rows,
                      new Set(filteredPreview.map((row) => row.rowId)),
                      true
                    )
                  )
                }
              >
                {t('preview.selectFiltered', { count: filteredPreview.length })}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setPreviewRows((rows) =>
                    setPreviewSelection(
                      rows,
                      new Set(filteredPreview.map((row) => row.rowId)),
                      false
                    )
                  )
                }
              >
                {t('preview.deselectFiltered')}
              </Button>
            </div>
            <p className="sr-only">{t('preview.duplicatesHelp')}</p>
            {includedCount > 0 ? (
              <CategorySelect
                value=""
                categories={categories}
                showRecentCategories={false}
                captionLabel={t('preview.bulkCategory', { count: includedCount })}
                onValueChange={(category) =>
                  setPreviewRows((rows) =>
                    rows.map((row) => (row.include ? { ...row, category } : row))
                  )
                }
              />
            ) : null}
            <section
              aria-label={t('preview.accountTotals')}
              className="space-y-2 border-y border-border py-3"
            >
              {summaries.map((summary) => (
                <div key={summary.accountId} className="text-sm">
                  <p className="font-semibold">
                    {accounts.find((account) => account.id === summary.accountId)?.name ??
                      t('preview.accountFallback')}{' '}
                    · {t('preview.rowsCount', { count: summary.count })}
                  </p>
                  <p className="tabular-nums">
                    {t('preview.typeIncome')}: +{formatCurrencyLocale(summary.income, locale)} ·{' '}
                    {t('preview.typeExpense')}: −{formatCurrencyLocale(summary.expense, locale)}
                  </p>
                </div>
              ))}
            </section>
            <div
              ref={previewScrollRef}
              className="max-h-[45dvh] overflow-y-auto pr-1"
              aria-label={t('preview.rowsAria')}
            >
              {pageRows.length === 0 ? <p role="status">{t('preview.noRows')}</p> : null}
              {pageRows.map((row) => (
                <div key={row.rowId} className="pb-2">
                  <ImportPreviewRow
                    row={row}
                    rowNumber={previewRows.indexOf(row) + 1}
                    categories={categories}
                    t={t}
                    accountName={accounts.find((account) => account.id === row.account_id)?.name}
                    userName={groupUsers.find((user) => user.id === row.user_id)?.name ?? undefined}
                    onToggleInclude={handleToggleInclude}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
              ))}
            </div>
            <nav
              aria-label={t('preview.paginationAria')}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={safePage === 0}
                onClick={() => changePreviewPage(safePage - 1)}
              >
                {t('preview.previous')}
              </Button>
              <span className="text-sm" role="status">
                {t('preview.page', { page: safePage + 1, total: pageCount })}
              </span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={safePage >= pageCount - 1}
                onClick={() => changePreviewPage(safePage + 1)}
              >
                {t('preview.next')}
              </Button>
            </nav>
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
