import { describe, expect, it, vi } from 'vitest';
import { readWithRetry } from './read-with-retry';

describe('standalone read recovery', () => {
  it('retries a wrapped pool failure once with a fresh query', async () => {
    const failure = new Error('query failed', {
      cause: Object.assign(new Error('pool busy'), { code: 'CONNECT_TIMEOUT' }),
    });
    const read = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(['saved transaction']);
    expect(await readWithRetry(read)).toEqual(['saved transaction']);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it('does not retry when the remaining deadline cannot accommodate a connection', async () => {
    const error = Object.assign(new Error('closed'), { code: 'CONNECTION_CLOSED' });
    const read = vi.fn().mockRejectedValue(error);
    await expect(readWithRetry(read, { deadline: Date.now() + 1000 })).rejects.toBe(error);
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('propagates persistent failures after two attempts', async () => {
    const error = Object.assign(new Error('closed'), { code: 'CONNECTION_CLOSED' });
    const read = vi.fn().mockRejectedValue(error);
    await expect(readWithRetry(read)).rejects.toBe(error);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it.each(['23503', '42501', '57014', '42P01', 'QUEUE_TIMEOUT'])(
    'does not retry permanent or statement failures (%s)',
    async (code) => {
      const error = Object.assign(new Error('failed'), { code });
      const read = vi.fn().mockRejectedValue(error);
      await expect(readWithRetry(read)).rejects.toBe(error);
      expect(read).toHaveBeenCalledTimes(1);
    }
  );
});
