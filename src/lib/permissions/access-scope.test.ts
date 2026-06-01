import { describe, it, expect } from 'vitest';
import type { User } from '@/lib/types';
import { AccessScope } from './access-scope';

const member = {
  id: 'member-1',
  name: 'Member',
  email: 'member@example.com',
  role: 'member',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

const admin = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

describe('AccessScope', () => {
  describe('canViewUser', () => {
    it('member can view only self', () => {
      const scope = AccessScope.for(member);
      expect(scope.canViewUser('member-1')).toBe(true);
      expect(scope.canViewUser('member-2')).toBe(false);
      expect(scope.canViewUser(null)).toBe(false);
      expect(scope.canViewUser(undefined)).toBe(false);
    });

    it('admin can view any user id', () => {
      const scope = AccessScope.for(admin);
      expect(scope.canViewUser('member-2')).toBe(true);
    });
  });

  describe('canViewOwned', () => {
    it('member sees only owned rows with their user_id', () => {
      const scope = AccessScope.for(member);
      expect(scope.canViewOwned({ user_id: 'member-1' })).toBe(true);
      expect(scope.canViewOwned({ user_id: 'member-2' })).toBe(false);
      expect(scope.canViewOwned({ user_id: null })).toBe(false);
    });
  });

  describe('canViewShared', () => {
    it('member sees shared resource when linked via user_ids', () => {
      const scope = AccessScope.for(member);
      expect(scope.canViewShared({ user_ids: ['member-1'] })).toBe(true);
      expect(scope.canViewShared({ user_ids: ['member-2'] })).toBe(false);
      expect(scope.canViewShared({ user_ids: ['member-2', 'member-1'] })).toBe(true);
    });

    it('admin sees any shared resource', () => {
      const scope = AccessScope.for(admin);
      expect(scope.canViewShared({ user_ids: ['member-2'] })).toBe(true);
    });
  });

  describe('filterOwned', () => {
    it('member gets only own items', () => {
      const scope = AccessScope.for(member);
      const items = [
        { id: '1', user_id: 'member-1' },
        { id: '2', user_id: 'member-2' },
      ];
      expect(scope.filterOwned(items)).toEqual([{ id: '1', user_id: 'member-1' }]);
    });

    it('admin gets all items', () => {
      const scope = AccessScope.for(admin);
      const items = [
        { id: '1', user_id: 'member-1' },
        { id: '2', user_id: 'member-2' },
      ];
      expect(scope.filterOwned(items)).toEqual(items);
    });
  });

  describe('filterShared', () => {
    it('member gets only linked accounts', () => {
      const scope = AccessScope.for(member);
      const items = [
        { id: 'a1', user_ids: ['member-1'] },
        { id: 'a2', user_ids: ['member-2'] },
      ];
      expect(scope.filterShared(items)).toEqual([{ id: 'a1', user_ids: ['member-1'] }]);
    });
  });

  describe('pickUserRecord', () => {
    it('member gets only their key', () => {
      const scope = AccessScope.for(member);
      const record = { 'member-1': { x: 1 }, 'member-2': { x: 2 } };
      expect(scope.pickUserRecord(record)).toEqual({ 'member-1': { x: 1 } });
    });

    it('admin gets full record', () => {
      const scope = AccessScope.for(admin);
      const record = { 'member-1': { x: 1 }, 'member-2': { x: 2 } };
      expect(scope.pickUserRecord(record)).toEqual(record);
    });
  });
});
