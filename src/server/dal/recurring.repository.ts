import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Recurring Transaction Repository
 * Handles all database operations for recurring transactions using Prisma.
 */
export class RecurringRepository {
  /**
   * Get recurring transaction by ID
   */
  static async getById(id: string) {
    return prisma.recurring_transactions.findUnique({
      where: { id },
      include: {
        accounts: true, // Include account to check group access if needed
      }
    });
  }

  /**
   * Get recurring transactions by account ID
   */
  static getByAccount = cache(async (accountId: string) => {
    return prisma.recurring_transactions.findMany({
      where: { account_id: accountId },
      orderBy: { created_at: 'desc' },
    });
  });

  /**
   * Create a new recurring transaction
   */
  /**
   * Create a new recurring transaction
   */
  static async create(data: Prisma.recurring_transactionsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.recurring_transactions.create({
      data,
    });
  }

  /**
   * Update a recurring transaction
   */
  static async update(id: string, data: Prisma.recurring_transactionsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.recurring_transactions.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a recurring transaction
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.recurring_transactions.delete({
      where: { id },
    });
  }

  /**
   * Get recurring transactions by user ID
   */
  static getByUser = cache(async (userId: string) => {
    return prisma.recurring_transactions.findMany({
      where: {
        user_ids: {
          has: userId
        }
      },
      orderBy: { created_at: 'desc' },
    });
  });

  /**
   * Get recurring transactions overlapping with user IDs
   */
  static getByUserIds = cache(async (userIds: string[]) => {
    return prisma.recurring_transactions.findMany({
      where: {
        user_ids: {
          hasSome: userIds
        }
      },
      orderBy: { created_at: 'desc' },
    });
  });
}
