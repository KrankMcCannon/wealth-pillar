import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Group Repository
 * Handles all database operations for groups using Prisma.
 */
export class GroupRepository {
  /**
   * Get group by ID
   */
  static getById = cache(async (id: string) => {
    return prisma.groups.findUnique({
      where: { id },
    });
  });

  /**
   * Create a new group
   */
  /**
   * Create a new group
   */
  static async create(data: Prisma.groupsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.groups.create({
      data,
    });
  }

  /**
   * Update a group
   */
  static async update(id: string, data: Prisma.groupsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.groups.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a group
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.groups.delete({
      where: { id },
    });
  }
}
