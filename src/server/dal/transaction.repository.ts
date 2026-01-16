import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Transaction Repository
 * Handles all database operations for transactions using Prisma.
 * Implements the Data Access Layer (DAL) pattern.
 */
export class TransactionRepository {
  /**
   * Get transactions by user ID with optional filtering
   * Cached per request using React cache()
   */
  static getByUser = cache(async (
    userId: string,
    filters?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      category?: string;
      type?: 'income' | 'expense' | 'transfer';
      accountId?: string;
    }
  ) => {
    const where: Prisma.transactionsWhereInput = {
      user_id: userId,
      date: {
        gte: filters?.startDate,
        lte: filters?.endDate,
      },
      category: filters?.category,
      type: filters?.type,
      account_id: filters?.accountId,
    };

    const [data, total] = await Promise.all([
      prisma.transactions.findMany({
        where,
        orderBy: { date: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.transactions.count({ where }),
    ]);

    return { data, total };
  });

  /**
   * Create a new transaction
   */
  /**
   * Create a new transaction
   */
  static async create(data: Prisma.transactionsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.transactions.create({
      data,
    });
  }

  /**
   * Update a transaction
   */
  static async update(id: string, data: Prisma.transactionsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.transactions.update({
      where: { id },
      data,
    });
  }

  /**
   * Get transaction by ID
   */
  static async getById(id: string) {
    return prisma.transactions.findUnique({
      where: { id },
    });
  }


  /**
   * Delete a transaction
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.transactions.delete({
      where: { id },
    });
  }

  /**
   * Delete all transactions for a user
   */
  static async deleteByUser(userId: string, tx: Prisma.TransactionClient = prisma) {
    return tx.transactions.deleteMany({
      where: { user_id: userId },
    });
  }

  /**
   * Delete all transactions for an account
   */
  static async deleteByAccount(accountId: string, tx: Prisma.TransactionClient = prisma) {
    return tx.transactions.deleteMany({
      where: {
        OR: [
          { account_id: accountId },
          { to_account_id: accountId }
        ]
      },
    });
  }

  /**
   * Get transactions by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    return prisma.transactions.findMany({
      where: { group_id: groupId },
      orderBy: { date: 'desc' },
    });
  });

  /**
   * Get transactions by account ID (including transfers to account)
   */
  static getByAccount = cache(async (accountId: string) => {
    return prisma.transactions.findMany({
      where: {
        OR: [
          { account_id: accountId },
          { to_account_id: accountId }
        ]
      },
      orderBy: { date: 'desc' },
    });
  });
}
