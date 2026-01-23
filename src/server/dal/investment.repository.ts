import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Investment Repository
 * Handles all database operations for investments using Prisma.
 */
export class InvestmentRepository {
  /**
   * Get investments by user ID
   * Cached per request using React cache()
   */
  static getByUser = cache(async (userId: string) => {
    return prisma.investments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  });

  /**
   * Create a new investment
   */
  static async create(data: Prisma.investmentsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.investments.create({
      data,
    });
  }

  /**
   * Update an investment
   */
  static async update(id: string, data: Prisma.investmentsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.investments.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an investment
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.investments.delete({
      where: { id },
    });
  }

  /**
   * Get investment by ID
   */
  static async getById(id: string) {
    return prisma.investments.findUnique({
      where: { id },
    });
  }
}
