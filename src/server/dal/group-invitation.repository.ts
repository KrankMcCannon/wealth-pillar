import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

/**
 * Group Invitation Repository
 * Handles all database operations for group invitations using Prisma.
 */
export class GroupInvitationRepository {
  /**
   * Get invitation by ID
   */
  static getById = cache(async (id: string) => {
    return prisma.group_invitations.findUnique({
      where: { id },
    });
  });

  /**
   * Get invitation by Token
   */
  static getByToken = cache(async (token: string) => {
    return prisma.group_invitations.findUnique({
      where: { invitation_token: token },
    });
  });

  /**
   * Get invitations by Group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    return prisma.group_invitations.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'desc' },
    });
  });

  /**
   * Get pending invitation by Email and Group ID
   */
  static async getPendingByEmailAndGroup(email: string, groupId: string) {
    return prisma.group_invitations.findFirst({
      where: {
        email,
        group_id: groupId,
        status: 'pending',
      },
    });
  }

  /**
   * Create a new invitation
   */
  /**
   * Create a new invitation
   */
  static async create(data: Prisma.group_invitationsCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.group_invitations.create({
      data,
    });
  }

  /**
   * Update an invitation
   */
  static async update(id: string, data: Prisma.group_invitationsUpdateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.group_invitations.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an invitation
   */
  static async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.group_invitations.delete({
      where: { id },
    });
  }
}
