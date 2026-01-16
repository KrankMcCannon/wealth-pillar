import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * User Repository
 * Handles all database operations for users using Prisma.
 */
export class UserRepository {
  /**
   * Get user by Clerk ID
   */
  static getByClerkId = cache(async (clerkId: string) => {
    return prisma.users.findUnique({
      where: { clerk_id: clerkId },
      include: {
        user_preferences: true,
      },
    });
  });

  /**
   * Get user by ID
   */
  static getById = cache(async (id: string) => {
    return prisma.users.findUnique({
      where: { id },
      include: {
        user_preferences: true,
      },
    });
  });

  /**
   * Get users by Group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    return prisma.users.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'asc' },
    });
  });

  /**
   * Create a new user
   */
  static async create(data: Prisma.usersCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.users.create({
      data,
    });
  }

  /**
   * Update a user
   */
  static async update(id: string, data: Prisma.usersUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.users.update({
      where: { id },
      data,
    });
  }

  /**
   * Find user by budget period ID (searching inside JSON array)
   */
  static async findUserByPeriodId(periodId: string) {
    // Uses Prisma's JSON filtering capabilities for Postgres
    return prisma.users.findFirst({
      where: {
        budget_periods: {
          array_contains: [{ id: periodId }]
        }
      }
    });
  }

  /**
   * Delete a user
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.users.delete({
      where: { id },
    });
  }

  /**
   * Get user by email
   */
  static getByEmail = cache(async (email: string) => {
    return prisma.users.findUnique({
      where: { email },
    });
  });

  /**
   * Count users in a group
   */
  static async countByGroup(groupId: string) {
    return prisma.users.count({
      where: { group_id: groupId }
    });
  }

  /**
   * Get users by group and role
   */
  static getByGroupAndRole = cache(async (groupId: string, role: string) => {
    return prisma.users.findMany({
      where: {
        group_id: groupId,
        role: role
      },
      orderBy: { created_at: 'asc' }
    });
  });
}
