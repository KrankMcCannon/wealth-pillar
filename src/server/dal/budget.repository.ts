import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Budget Repository
 * Handles all database operations for budgets using Prisma.
 */
export class BudgetRepository {
  /**
   * Get budgets by user ID
   * Cached per request using React cache()
   */
  static getByUser = cache(async (userId: string) => {
    return prisma.budgets.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  });

  /**
   * Get budgets by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    return prisma.budgets.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'desc' },
    });
  });

  /**
   * Create a new budget
   */
  /**
   * Create a new budget
   */
  static async create(data: Prisma.budgetsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.budgets.create({
      data,
    });
  }

  /**
   * Update a budget
   */
  static async update(id: string, data: Prisma.budgetsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.budgets.update({
      where: { id },
      data,
    });
  }

  /**
   * Get budget by ID
   */
  static async getById(id: string) {
    return prisma.budgets.findUnique({
      where: { id },
    });
  }

  /**
   * Delete a budget
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.budgets.delete({
      where: { id },
    });
  }

  /**
   * Delete all budgets for a user
   */
  static async deleteByUser(userId: string, tx: Prisma.TransactionClient = prisma) {
    return tx.budgets.deleteMany({
      where: { user_id: userId },
    });
  }
}
