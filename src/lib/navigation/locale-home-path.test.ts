import { describe, expect, it } from 'vitest';
import { localeRootToHomePath } from './locale-home-path';

const locales = ['en', 'it'] as const;

describe('localeRootToHomePath', () => {
  it('maps a locale root to home and ignores deeper paths', () => {
    expect(localeRootToHomePath('/it', locales)).toBe('/it/home');
    expect(localeRootToHomePath('/en/', locales)).toBe('/en/home');
    expect(localeRootToHomePath('/it/home', locales)).toBeNull();
    expect(localeRootToHomePath('/it/sign-in', locales)).toBeNull();
    expect(localeRootToHomePath('/', locales)).toBeNull();
  });
});
