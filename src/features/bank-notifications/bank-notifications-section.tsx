'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellRing, Copy, RefreshCw } from 'lucide-react';
import { useAccounts, useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import {
  getBankSettingsAction,
  createBankConnectionAction,
  revokeBankConnectionAction,
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/form/form-select';
import { CategorySelect } from '@/components/form/category-select';
import type { User } from '@/lib/types';
import { NotificationInbox } from './notification-inbox';

type Settings = NonNullable<Awaited<ReturnType<typeof getBankSettingsAction>>['data']>;
export function BankNotificationsSection({ user }: { user: User }) {
  const t = useTranslations('BankNotifications');
  const storeAccounts = useAccounts().filter((account) => account.user_ids.includes(user.id));
  const storeCategories = useCategories();
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const accounts = settings?.accounts ?? storeAccounts;
  const categories = settings?.categories ?? storeCategories;
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [autoImport, setAutoImport] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(async () => {
    const result = await getBankSettingsAction();
    if (result.data) {
      setSettings(result.data);
      setRevision((value) => value + 1);
    } else setError(t('errors.unavailable'));
  }, [t]);
  useEffect(() => {
    if (!expanded) return;
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
  }, [expanded, t]);
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
    <section className="min-w-0">
      <button
        type="button"
        className="flex min-h-12 w-full items-center gap-3 py-3 text-left"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(!expanded);
          setToken(null);
        }}
      >
        <BellRing className="size-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 font-medium">{t('title')}</span>
        <span className="text-sm text-muted-foreground">Revolut</span>
      </button>
      {expanded ? (
        <div className="min-w-0 space-y-4 border-t border-border py-4">
          <p className="text-sm text-muted-foreground">{t('intro')}</p>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              perform(async () => {
                const result = await createBankConnectionAction({
                  name,
                  accountId,
                  category,
                  autoImport,
                });
                if (result.data) {
                  setToken(result.data.token);
                  setName('');
                  setCopied(false);
                }
                return result;
              });
            }}
          >
            <label className="block space-y-1 text-sm font-medium" htmlFor="bank-device-name">
              <span>{t('device')}</span>
              <Input
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
            <CategorySelect
              captionLabel={t('category')}
              value={category}
              onValueChange={setCategory}
              categories={categories}
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
            <Button type="submit" disabled={busy || !name.trim() || !accountId || !category}>
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
        </div>
      ) : null}
    </section>
  );
}
