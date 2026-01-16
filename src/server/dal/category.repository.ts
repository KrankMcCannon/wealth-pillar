import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Category Repository
 * Handles all database operations for categories using Prisma.
 */
export class CategoryRepository {
  /**
   * Get categories by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    return prisma.categories.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'asc' },
    });
  });

  /**
   * Create a new category
   */
  /**
   * Create a new category
   */
  static async create(data: Prisma.categoriesCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.categories.create({
      data,
    });
  }

  /**
   * Update a category
   */
  static async update(id: string, data: Prisma.categoriesUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.categories.update({
      where: { id },
      data,
    });
  }

  /**
   * Get category by ID
   */
  static async getById(id: string) {
    return prisma.categories.findUnique({
      where: { id },
    });
  }

  /**
   * Delete a category
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.categories.delete({
      where: { id },
    });
  }

  /**
   * Get all categories
   */
  static getAll = cache(async () => {
    return prisma.categories.findMany({
      orderBy: { label: 'asc' },
    });
  });

  /**
   * Get category by key
   */
  static getByKey = cache(async (key: string) => {
    return prisma.categories.findUnique({
      where: { key },
    });
  });
}
