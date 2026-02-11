import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBaseUrl, getAbsoluteUrl, isProduction, isDevelopment } from './url-utils';

describe('url-utils', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getBaseUrl', () => {
    it('should return NEXT_PUBLIC_APP_URL when set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      expect(getBaseUrl()).toBe('https://app.example.com');
    });

    it('should remove trailing slash from NEXT_PUBLIC_APP_URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com/';
      expect(getBaseUrl()).toBe('https://app.example.com');
    });

    it('should return localhost when env var is empty', () => {
      process.env.NEXT_PUBLIC_APP_URL = '';
      // Since we're in Node.js test environment without window
      expect(getBaseUrl()).toBe('http://localhost:3000');
    });

    it('should return localhost when env var is undefined and no window', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      // Save original window
      const originalWindow = globalThis.window;

      // Remove window to simulate server-side
      // @ts-expect-error - intentionally removing window
      delete globalThis.window;

      expect(getBaseUrl()).toBe('http://localhost:3000');

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('should use window.location.origin when available and no env var', () => {
      // Clear env var
      delete process.env.NEXT_PUBLIC_APP_URL;

      // In jsdom, window is defined, so it should use location.origin
      // The default jsdom URL is http://localhost/ so we test for that
      // or we mock it explicitly
      const originalLocation = globalThis.location;

      Object.defineProperty(globalThis, 'location', {
        value: { origin: 'https://browser.example.com' },
        writable: true,
        configurable: true,
      });

      expect(getBaseUrl()).toBe('https://browser.example.com');

      // Restore
      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('getAbsoluteUrl', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    });

    it('should construct absolute URL from relative path', () => {
      expect(getAbsoluteUrl('/auth/callback')).toBe('https://app.example.com/auth/callback');
    });

    it('should handle root path', () => {
      expect(getAbsoluteUrl('/')).toBe('https://app.example.com/');
    });

    it('should throw error for path not starting with /', () => {
      expect(() => getAbsoluteUrl('invalid-path')).toThrow('Path must start with /');
    });

    it('should throw error for empty path', () => {
      expect(() => getAbsoluteUrl('')).toThrow('Path must start with /');
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(isDevelopment()).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(isDevelopment()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(isDevelopment()).toBe(false);
    });
  });
});
