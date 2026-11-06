import { beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationInbox } from './notification-inbox';
import { getBankEventsAction, reviewBankNotificationAction } from './actions';
import type { User } from '@/lib/types';
vi.mock('./actions', () => ({
  getBankEventsAction: vi.fn(),
  reviewBankNotificationAction: vi.fn(),
}));
vi.mock('next-intl', () => {
  const t = Object.assign(
    (key: string, values?: { count?: number }) =>
      key === 'pendingCount' ? `${values?.count} pending` : key,
    { has: () => true }
  );
  return { useTranslations: () => t };
});
vi.mock('@/providers/currency-provider', () => ({ useCurrency: () => ({ format: String }) }));
vi.mock('@/stores/reference-data-store', () => ({
  useCategories: () => [],
  useReferenceDataStore: { getState: () => ({ finishBalanceMutation: vi.fn() }) },
}));
vi.mock('./complete-notification-modal', () => ({
  CompleteNotificationModal: () => <div role="dialog">Manual form</div>,
}));
const user = { id: 'owner', group_id: 'household' } as User;
const event = (id: string) => ({
  id,
  status: 'pending',
  parsed: null,
  category: null,
  reason: 'unknown_format',
  payload: { title: `Receipt ${id}`, body: 'New format' },
});
const page = (ids: string[], more = false) => ({
  data: {
    events: ids.map(event),
    pendingCount: 80,
    nextCursor: more ? { receivedAt: '2026-11-01T12:00:00.000001Z', id: ids.at(-1)! } : null,
  },
  error: null,
});
const perform = async (action: () => Promise<unknown>) => {
  await action();
};
const props = { user, revision: 0, busy: false, perform, onComplete: async () => {} };
beforeEach(() => vi.resetAllMocks());
it('announces the full pending count and appends pages without repeating events', async () => {
  const click = userEvent.setup();
  vi.mocked(getBankEventsAction)
    .mockResolvedValueOnce(page(['one', 'two'], true) as never)
    .mockResolvedValueOnce(page(['two', 'three']) as never);
  render(<NotificationInbox {...props} />);
  expect(await screen.findByRole('status')).toHaveTextContent('80 pending');
  await click.click(await screen.findByRole('button', { name: 'loadMore' }));
  expect(await screen.findByText('Receipt three')).toBeInTheDocument();
  expect(screen.getAllByText('Receipt two')).toHaveLength(1);
  expect(getBankEventsAction).toHaveBeenLastCalledWith({
    status: 'pending',
    cursor: { receivedAt: '2026-11-01T12:00:00.000001Z', id: 'two' },
  });
  expect(screen.queryByRole('button', { name: 'loadMore' })).not.toBeInTheDocument();
});
it('shows the recovery form for an unparsed event and can still ignore it', async () => {
  const click = userEvent.setup();
  vi.mocked(getBankEventsAction).mockResolvedValue(page(['unknown']) as never);
  vi.mocked(reviewBankNotificationAction).mockResolvedValue({ data: null, error: null });
  render(<NotificationInbox {...props} />);
  await click.click(await screen.findByRole('button', { name: 'complete' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Manual form');
  await click.click(screen.getByRole('button', { name: 'ignore' }));
  expect(reviewBankNotificationAction).toHaveBeenCalledExactlyOnceWith({
    id: 'unknown',
    decision: 'ignore',
  });
});
it('ignores an obsolete pending response after switching to history', async () => {
  const click = userEvent.setup();
  let release!: (value: Awaited<ReturnType<typeof getBankEventsAction>>) => void;
  vi.mocked(getBankEventsAction)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    )
    .mockResolvedValueOnce(page(['history']) as never);
  render(<NotificationInbox {...props} />);
  await click.click(screen.getByRole('button', { name: 'historyTab' }));
  expect(await screen.findByText('Receipt history')).toBeInTheDocument();
  await act(async () => release(page(['obsolete']) as never));
  expect(screen.queryByText('Receipt obsolete')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'historyTab' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
it('keeps loaded events after a failed next page and allows retrying that cursor', async () => {
  const click = userEvent.setup();
  vi.mocked(getBankEventsAction)
    .mockResolvedValueOnce(page(['one'], true) as never)
    .mockResolvedValueOnce({ data: null, error: 'unavailable' })
    .mockResolvedValueOnce(page(['two']) as never);
  render(<NotificationInbox {...props} />);
  await click.click(await screen.findByRole('button', { name: 'loadMore' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('errors.unavailable');
  expect(screen.getByText('Receipt one')).toBeInTheDocument();
  await click.click(screen.getByRole('button', { name: 'loadMore' }));
  expect(await screen.findByText('Receipt two')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
