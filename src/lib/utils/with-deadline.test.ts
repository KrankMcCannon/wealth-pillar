import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionTimeoutError, withDeadline } from './with-deadline';

afterEach(() => vi.useRealTimers());

describe('withDeadline', () => {
  it('releases a caller even if the request never settles', async () => {
    vi.useFakeTimers();
    const result = withDeadline(new Promise(() => {}), 100);
    const assertion = expect(result).rejects.toBeInstanceOf(ActionTimeoutError);
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores a late result and clears timers on success and rejection', async () => {
    vi.useFakeTimers();
    let finish!: (value: string) => void;
    const request = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const result = withDeadline(request, 100);
    const assertion = expect(result).rejects.toBeInstanceOf(ActionTimeoutError);
    await vi.advanceTimersByTimeAsync(100);
    finish('late success');
    await assertion;
    await expect(withDeadline(Promise.resolve('ok'))).resolves.toBe('ok');
    await expect(withDeadline(Promise.reject(new Error('failed')))).rejects.toThrow('failed');
    expect(vi.getTimerCount()).toBe(0);
  });
});
