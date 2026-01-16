import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * User Preferences Repository
 * Handles all database operations for user preferences using Prisma.
 */
export class UserPreferencesRepository {
  /**
   * Get user preferences by User ID
   */
  static getByUserId = cache(async (userId: string) => {
    return prisma.user_preferences.findUnique({
      where: { user_id: userId },
    });
  });

  /**
   * Create user preferences
   */
  /**
   * Create user preferences
   */
  static async create(data: Prisma.user_preferencesCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.user_preferences.create({
      data,
    });
  }

  /**
   * Update user preferences
   */
  static async update(userId: string, data: Prisma.user_preferencesUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.user_preferences.update({
      where: { user_id: userId },
      data,
    });
  }

  /**
   * Delete user preferences
   */
  static async delete(userId: string, tx: Prisma.TransactionClient = prisma) {
    return tx.user_preferences.delete({
      where: { user_id: userId },
    });
  }
}
