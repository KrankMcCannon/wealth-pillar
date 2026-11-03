import { beforeEach, expect, it, vi } from 'vitest';
import { POST } from './route';
import {
  ingestBankNotification,
  NotificationError,
} from '@/server/use-cases/bank-notifications/notification-service';
vi.mock('@/server/use-cases/bank-notifications/notification-service', () => ({
  ingestBankNotification: vi.fn(),
  NotificationError: class extends Error {
    constructor(
      public code: string,
      public status = 400
    ) {
      super(code);
    }
  },
}));
const token = `wpn_${'x'.repeat(43)}`;
const input = { title: 'Pizzeria', body: 'Hai speso 17 €', occurredAt: '2026-11-01T18:30:00Z' };
function request(body: string = JSON.stringify(input), headers: Record<string, string> = {}) {
  return new Request('https://example.com/api/integrations/bank-notifications', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...headers },
    body,
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ingestBankNotification).mockResolvedValue({
    id: 'event',
    status: 'pending',
    duplicate: false,
  });
});
it('acknowledges review items and never caches bank responses', async () => {
  const result = await POST(request());
  expect(result.status).toBe(201);
  expect(result.headers.get('cache-control')).toBe('no-store');
  expect(await result.json()).toEqual({
    id: 'event',
    status: 'pending',
    duplicate: false,
    eventId: null,
  });
});
it('rejects unauthenticated, oversized and malformed requests before database work', async () => {
  expect((await POST(request('{}', { authorization: '' }))).status).toBe(401);
  expect((await POST(request('x'.repeat(20_000)))).status).toBe(413);
  expect((await POST(request('{broken'))).status).toBe(400);
  expect(
    (await POST(request(JSON.stringify({ ...input, account_id: 'client-controlled' })))).status
  ).toBe(400);
  expect(ingestBankNotification).not.toHaveBeenCalled();
});
it('provides a retry interval for throttled devices', async () => {
  vi.mocked(ingestBankNotification).mockRejectedValue(new NotificationError('rate_limited', 429));
  const result = await POST(request());
  expect(result.status).toBe(429);
  expect(result.headers.get('retry-after')).toBe('60');
});

it('returns the stable client identity only after a committed delivery, including retries', async () => {
  const payload = JSON.stringify({ ...input, eventId: 'persisted-on-device' });
  const first = await POST(request(payload));
  expect(first.status).toBe(201);
  expect(await first.json()).toMatchObject({ eventId: 'persisted-on-device', id: 'event' });
  vi.mocked(ingestBankNotification).mockResolvedValue({
    id: 'event',
    status: 'pending',
    duplicate: true,
  });
  const retry = await POST(request(payload));
  expect(retry.status).toBe(200);
  expect(await retry.json()).toMatchObject({
    eventId: 'persisted-on-device',
    id: 'event',
    duplicate: true,
  });
  vi.mocked(ingestBankNotification).mockRejectedValue(
    new NotificationError('temporarily_unavailable', 503)
  );
  expect(await (await POST(request(payload))).json()).toEqual({ error: 'temporarily_unavailable' });
});
