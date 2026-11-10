import { describe, expect, it, vi } from 'vitest';
import { actionErrorMessage, logServerActionError } from './action-error';
import { ActionTimeoutError } from '@/lib/utils/with-deadline';

describe('actionErrorMessage', () => {
  it('hides SQL and parameter values while logging the underlying error code', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const error = new Error('Failed query: select email from users params: private-id', {
        cause: Object.assign(new Error('timeout'), { code: '57014' }),
      });
      expect(actionErrorMessage(error, 'Unavailable')).toBe('Unavailable');
      expect(log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ code: '57014' })
      );
      expect(JSON.stringify(log.mock.calls)).not.toContain('private-id');
      expect(actionErrorMessage(new ActionTimeoutError(), 'Unavailable')).toBe('Unavailable');
    } finally {
      log.mockRestore();
    }
  });

  it('preserves actionable domain validation', () => {
    expect(actionErrorMessage(new Error('Account is required'), 'Unavailable')).toBe(
      'Account is required'
    );
  });

  it('does not emit driver messages or parameters from action logs', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const error = Object.assign(new Error('private financial value'), { code: '57014' });
      logServerActionError('updateInvestment', error);
      expect(log).toHaveBeenCalledWith('[ServerAction]', {
        operation: 'updateInvestment',
        code: '57014',
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain('private financial value');
    } finally {
      log.mockRestore();
    }
  });
});
