'use client';

import { withDeadline } from '@/lib/utils/with-deadline';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, RefreshCw } from 'lucide-react';
import { useAccounts, useReferenceDataStore } from '@/stores/reference-data-store';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import {
  getBankSettingsAction,
  createBankConnectionAction,
  revokeBankConnectionAction,
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/form/form-select';
import { ModalWrapper, ModalBody } from '@/components/ui/modal-wrapper';
import { formModalStyles as modalS } from '@/components/form/form-modal-styles';
import type { User } from '@/lib/types';
import { NotificationInbox } from './notification-inbox';

type Settings = NonNullable<Awaited<ReturnType<typeof getBankSettingsAction>>['data']>;
export function BankNotificationsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const t = useTranslations('BankNotifications');
  const storeAccounts = useAccounts().filter((account) => account.user_ids.includes(user.id));
  const [settings, setSettings] = useState<Settings | null>(null);
  const accounts = settings?.accounts ?? storeAccounts;
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [autoImport, setAutoImport] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(async () => {
    const result = await withDeadline(getBankSettingsAction());
    if (result.data) {
      setSettings(result.data);
      setRevision((value) => value + 1);
    } else setError(t('errors.unavailable'));
  }, [t]);
  useEffect(() => {
    let active = true;
    Promise.all([getBankSettingsAction(), getAllCategoriesAction()])
      .then(([result, cats]) => {
        if (!active) return;
        if (result.data) setSettings(result.data);
        else setError(t('errors.unavailable'));
        if (cats.data) useReferenceDataStore.getState().refreshCategories(cats.data);
      })
      .catch(() => {
        if (active) setError(t('errors.unavailable'));
      });
    return () => {
      active = false;
    };
  }, [t]);
  async function perform(action: () => Promise<{ error: string | null }>) {
    setBusy(true);
    setError('');
    try {
      const result = await action();
      if (result.error)
        setError(
          t.has(`errors.${result.error}`) ? t(`errors.${result.error}`) : t('errors.unavailable')
        );
      else await refresh();
    } catch {
      setError(t('errors.unavailable'));
    } finally {
      setBusy(false);
    }
  }
  const endpoint =
    typeof window === 'undefined'
      ? '/api/integrations/bank-notifications'
      : `${window.location.origin}/api/integrations/bank-notifications`;
  return (
    <ModalWrapper
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('title')}
      disableOutsideClose={busy}
    >
      <ModalBody className="min-w-0 space-y-6 overflow-y-auto px-4 pb-6">
        <p className="text-sm text-muted-foreground">{t('categoryHelp')}</p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            perform(async () => {
              const result = await withDeadline(
                createBankConnectionAction({
                  name,
                  accountId,
                  autoImport,
                })
              );
              if (result.data) {
                setToken(result.data.token);
                setName('');
                setCopied(false);
              }
              return result;
            });
          }}
        >
          <label className={modalS.field.textShell} htmlFor="bank-device-name">
            <span className={modalS.field.textLabel}>{t('device')}</span>
            <Input
              className={modalS.field.textInput}
              id="bank-device-name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('deviceExample')}
              disabled={busy}
            />
          </label>
          <FormSelect
            captionLabel={t('account')}
            value={accountId}
            onValueChange={setAccountId}
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            disabled={busy}
          />
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={autoImport}
              onChange={(event) => setAutoImport(event.target.checked)}
              disabled={busy}
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            <span>{t('autoImport')}</span>
          </label>
          <Button className="w-full" type="submit" disabled={busy || !name.trim() || !accountId}>
            {t('connect')}
          </Button>
        </form>
        {token ? (
          <div className="min-w-0 space-y-3 rounded-xl border border-border bg-muted p-3">
            <p className="text-sm font-medium">{t('secretOnce')}</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>{t('shortcut1')}</li>
              <li>{t('shortcut2')}</li>
              <li>{t('shortcut3')}</li>
            </ol>
            <p className="break-all text-sm">
              <strong>URL: </strong>
              {endpoint}
            </p>
            <p className="break-all font-mono text-xs">Authorization: Bearer {token}</p>
            <pre className="whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-xs">
              {JSON.stringify(
                {
                  provider: 'revolut',
                  eventId: t('eventIdVariable'),
                  title: t('titleVariable'),
                  body: t('bodyVariable'),
                  occurredAt: t('dateVariable'),
                },
                null,
                2
              )}
            </pre>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard
                  .writeText(`Bearer ${token}`)
                  .then(() => setCopied(true))
                  .catch(() => setError(t('errors.clipboard')));
              }}
            >
              <Copy className="size-4" aria-hidden />
              {copied ? t('copied') : t('copy')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('retryHelp')}</p>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-expense">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">{t('devices')}</h3>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            aria-label={t('refresh')}
            onClick={() => perform(async () => ({ error: null }))}
          >
            <RefreshCw className="size-4" aria-hidden />
          </Button>
        </div>
        {!settings ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('loading')}
          </p>
        ) : null}
        <ul className="divide-y divide-border">
          {settings?.connections.map((connection) => (
            <li
              key={connection.id}
              className="flex min-w-0 items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                <p className="wrap-break-word font-medium">{connection.name}</p>
                <p className="text-xs text-muted-foreground">
                  {connection.revoked_at
                    ? t('revoked')
                    : connection.auto_import
                      ? t('automatic')
                      : t('reviewMode')}
                </p>
              </div>
              {!connection.revoked_at ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => perform(() => revokeBankConnectionAction(connection.id))}
                >
                  {t('revoke')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        <NotificationInbox
          user={user}
          revision={revision}
          busy={busy}
          perform={perform}
          onComplete={refresh}
        />
      </ModalBody>
    </ModalWrapper>
  );
}
