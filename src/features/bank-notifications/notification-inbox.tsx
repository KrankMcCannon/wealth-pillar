'use client';

import { useFinancialCommand } from '@/hooks/use-financial-command';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/providers/currency-provider';
import { useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import { Button } from '@/components/ui/button';
import { CategorySelect } from '@/components/form/category-select';
import type { User } from '@/lib/types';
import { getBankEventsAction, reviewBankNotificationAction } from './actions';
import { CompleteNotificationModal } from './complete-notification-modal';

type Page = NonNullable<Awaited<ReturnType<typeof getBankEventsAction>>['data']>;
type NotificationEvent = Page['events'][number];
type Perform = (action: () => Promise<{ error: string | null }>) => Promise<void>;

export function NotificationInbox({
  user,
  revision,
  busy,
  perform,
  onComplete,
}: {
  user: User;
  revision: number;
  busy: boolean;
  perform: Perform;
  onComplete: () => Promise<void>;
}) {
  const t = useTranslations('BankNotifications');
  const [status, setStatus] = useState<'pending' | 'history'>('pending');
  const [page, setPage] = useState<Page | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const request = ++generation.current;
    let active = true;
    getBankEventsAction({ status })
      .then((result) => {
        if (!active || request !== generation.current) return;
        if (result.data) {
          setPage(result.data);
          setError('');
        } else setError(t('errors.unavailable'));
      })
      .catch(() => {
        if (active) setError(t('errors.unavailable'));
      });
    return () => {
      active = false;
      generation.current = request + 1;
    };
  }, [status, revision, retry, t]);
  async function loadMore() {
    if (!page?.nextCursor || loadingMore) return;
    const request = generation.current;
    setLoadingMore(true);
    try {
      const result = await getBankEventsAction({ status, cursor: page.nextCursor });
      if (request !== generation.current) return;
      if (!result.data) {
        setError(t('errors.unavailable'));
        return;
      }
      const next = result.data;
      setPage((previous) => ({
        ...next,
        events: [
          ...new Map(
            [...(previous?.events ?? []), ...next.events].map((event) => [event.id, event])
          ).values(),
        ],
      }));
      setError('');
    } catch {
      if (request === generation.current) setError(t('errors.unavailable'));
    } finally {
      setLoadingMore(false);
    }
  }
  return (
    <div className="min-w-0 space-y-3">
      <h3 className="font-medium">{t('inbox')}</h3>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {page ? t('pendingCount', { count: page.pendingCount }) : t('loading')}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('inbox')}>
        {(['pending', 'history'] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={status === value ? 'default' : 'outline'}
            aria-pressed={status === value}
            disabled={busy || loadingMore}
            onClick={() => {
              if (value === status) return;
              generation.current++;
              setStatus(value);
              setPage(null);
              setError('');
            }}
          >
            {t(value === 'pending' ? 'pendingTab' : 'historyTab')}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t('inboxHint')}</p>
      {error ? (
        <div role="alert">
          <p className="text-sm text-expense">{error}</p>
          <Button type="button" variant="outline" onClick={() => setRetry((value) => value + 1)}>
            {t('refresh')}
          </Button>
        </div>
      ) : null}
      {page?.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : null}
      <ul className="divide-y divide-border" aria-busy={loadingMore}>
        {page?.events.map((event) => (
          <NotificationRow
            key={event.id}
            event={event}
            busy={busy || loadingMore}
            perform={perform}
            user={user}
            onComplete={onComplete}
          />
        ))}
      </ul>
      {page?.nextCursor ? (
        <Button type="button" variant="outline" disabled={busy || loadingMore} onClick={loadMore}>
          {loadingMore ? t('loading') : t('loadMore')}
        </Button>
      ) : null}
    </div>
  );
}

function NotificationRow({
  event,
  busy,
  perform,
  user,
  onComplete,
}: {
  event: NotificationEvent;
  user: User;
  onComplete: () => Promise<void>;
  busy: boolean;
  perform: (action: () => Promise<{ error: string | null }>) => Promise<void>;
}) {
  const financialCommand = useFinancialCommand();

  const { format: formatCurrency } = useCurrency();
  const t = useTranslations('BankNotifications');
  const categories = useCategories();
  const [category, setCategory] = useState(event.category ?? '');
  const [completing, setCompleting] = useState(false);
  const review = async (decision: 'import' | 'ignore') => {
    const result = await financialCommand(
      'reviewBankNotificationAction',
      [
        {
          id: event.id,
          decision,
          ...(decision === 'import' ? { category } : {}),
        },
      ],
      (operationId, args) => reviewBankNotificationAction(...args, operationId)
    );
    if (result.data)
      useReferenceDataStore
        .getState()
        .finishBalanceMutation(`notification:${event.id}`, result.data);
    return result;
  };
  return (
    <li className="min-w-0 space-y-2 py-3">
      <div className="flex min-w-0 justify-between gap-3">
        <p className="min-w-0 wrap-break-word font-medium">
          {event.parsed?.description ?? event.payload?.title ?? t('unrecognized')}
        </p>
        {event.parsed ? (
          <span className="shrink-0 tabular-nums">
            {event.parsed.type === 'expense' ? '−' : '+'}
            {formatCurrency(Number(event.parsed.amount))}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {event.parsed?.date} · {t(`statuses.${event.status}`)}
      </p>
      {event.status === 'pending' ? (
        <>
          {event.reason ? (
            <p className="text-sm text-muted-foreground">
              {t.has(`reasons.${event.reason}`) ? t(`reasons.${event.reason}`) : t('unrecognized')}
            </p>
          ) : null}
          {!event.parsed && event.payload?.body ? (
            <p className="whitespace-pre-wrap wrap-break-word text-sm">{event.payload.body}</p>
          ) : null}
          {event.parsed ? (
            <CategorySelect
              captionLabel={t('category')}
              value={category}
              onValueChange={setCategory}
              categories={categories}
              disabled={busy}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {event.parsed ? (
              <Button
                type="button"
                disabled={busy || !category}
                onClick={() => perform(() => review('import'))}
              >
                {t('import')}
              </Button>
            ) : null}
            {!event.parsed ? (
              <Button type="button" disabled={busy} onClick={() => setCompleting(true)}>
                {t('complete')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => perform(() => review('ignore'))}
            >
              {t('ignore')}
            </Button>
          </div>
        </>
      ) : null}
      {completing ? (
        <CompleteNotificationModal
          event={event}
          user={user}
          onClose={() => setCompleting(false)}
          onComplete={onComplete}
        />
      ) : null}
    </li>
  );
}
