import { describe, expect, it } from 'vitest';
import {
  parseReturnTo,
  pathWithoutReturnTo,
  withReturnTo,
} from './return-to';

describe('withReturnTo', () => {
  it('appends a safe internal path as from', () => {
    expect(withReturnTo('/transactions?user=u1', '/budgets/b1')).toBe(
      '/transactions?user=u1&from=%2Fbudgets%2Fb1'
    );
  });

  it('leaves href unchanged for external or protocol-relative paths', () => {
    expect(withReturnTo('/transactions', '//evil.example')).toBe('/transactions');
    expect(withReturnTo('/transactions', 'https://evil.example')).toBe('/transactions');
  });
});

describe('parseReturnTo', () => {
  it('returns the decoded internal path', () => {
    const params = new URLSearchParams('from=%2Fbudgets%2Fb1');
    expect(parseReturnTo(params)).toBe('/budgets/b1');
  });

  it('ignores missing or unsafe values', () => {
    expect(parseReturnTo(new URLSearchParams())).toBeUndefined();
    expect(parseReturnTo(new URLSearchParams('from=%2F%2Fevil.example'))).toBeUndefined();
  });
});

describe('pathWithoutReturnTo', () => {
  it('strips from so nested navigations do not stack it', () => {
    expect(pathWithoutReturnTo('/reports', 'preset=monthly&from=%2Fhome')).toBe(
      '/reports?preset=monthly'
    );
  });
});
