import { describe, it, expect } from 'vitest';
import { getTempId } from './temp-id';

describe('getTempId', () => {
  // Note: The counter is global in the module, so IDs will increment across tests
  
  describe('basic functionality', () => {
    it('should return an ID with default prefix', () => {
      const id = getTempId();
      expect(id).toMatch(/^temp-\d+$/);
    });

    it('should return an ID with custom prefix', () => {
      const id = getTempId('custom');
      expect(id).toMatch(/^custom-\d+$/);
    });
  });

  describe('incrementing counter', () => {
    it('should return incrementing IDs', () => {
      const id1 = getTempId('test');
      const id2 = getTempId('test');
      const id3 = getTempId('test');
      
      // Extract numbers and verify they're incrementing
      const num1 = Number.parseInt(id1.split('-')[1], 10);
      const num2 = Number.parseInt(id2.split('-')[1], 10);
      const num3 = Number.parseInt(id3.split('-')[1], 10);
      
      expect(num2).toBe(num1 + 1);
      expect(num3).toBe(num2 + 1);
    });

    it('should maintain counter across different prefixes', () => {
      const id1 = getTempId('prefix-a');
      const id2 = getTempId('prefix-b');
      
      const num1 = Number.parseInt(id1.split('-').pop()!, 10);
      const num2 = Number.parseInt(id2.split('-').pop()!, 10);
      
      expect(num2).toBe(num1 + 1);
    });
  });

  describe('prefix variations', () => {
    it('should handle empty string prefix', () => {
      const id = getTempId('');
      expect(id).toMatch(/^-\d+$/);
    });

    it('should handle prefix with special characters', () => {
      const id = getTempId('my-prefix');
      expect(id).toMatch(/^my-prefix-\d+$/);
    });
  });
});
