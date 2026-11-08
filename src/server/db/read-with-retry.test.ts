import { describe, expect, it, vi } from 'vitest';
import { readWithRetry } from './read-with-retry';

describe('standalone read recovery', () => {
  it('retries a wrapped pool failure once with a fresh query', async () => {
    const failure = new Error('query failed', {
      cause: Object.assign(new Error('pool busy'), { code: 'QUEUE_TIMEOUT' }),
    });
    const read = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(['saved transaction']);
    expect(await readWithRetry(read)).toEqual(['saved transaction']);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it('retries a server statement timeout, but never a user cancellation', async () => {
    const error = Object.assign(new Error('canceling statement due to statement timeout'), {
      code: '57014',
    });
    const read = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('ok');
    expect(await readWithRetry(read)).toBe('ok');
    expect(read).toHaveBeenCalledTimes(2);
  });
  it('propagates persistent failures after two attempts', async () => {
    const error = Object.assign(new Error('closed'), { code: 'CONNECTION_CLOSED' });
    const read = vi.fn().mockRejectedValue(error);
    await expect(readWithRetry(read)).rejects.toBe(error);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it.each(['23503', '42501', '57014', '42P01'])(
    'does not retry permanent or statement failures (%s)',
    async (code) => {
      const error = Object.assign(new Error('failed'), { code });
      const read = vi.fn().mockRejectedValue(error);
      await expect(readWithRetry(read)).rejects.toBe(error);
      expect(read).toHaveBeenCalledTimes(1);
    }
  );
});
