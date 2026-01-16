import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Account Repository
 * Handles all database operations for accounts using Prisma.
 */
export class AccountRepository {
  /**
   * Get accounts by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    return prisma.accounts.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'asc' },
    });
  });

  /**
   * Get accounts by user ID (where user_ids contains userId)
   */
  static getByUser = cache(async (userId: string) => {
    return prisma.accounts.findMany({
      where: {
        user_ids: { has: userId }
      },
      orderBy: { created_at: 'asc' },
    });
  });

  /**
   * Get specific account by ID
   */
  static getById = cache(async (id: string) => {
    return prisma.accounts.findUnique({
      where: { id },
    });
  });

  /**
   * Create a new account
   */
  /**
   * Create a new account
   */
  static async create(data: Prisma.accountsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.accounts.create({
      data,
    });
  }

  /**
   * Update an account
   */
  static async update(id: string, data: Prisma.accountsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.accounts.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an account
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.accounts.delete({
      where: { id },
    });
  }
}
