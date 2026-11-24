import { GroupInvitationsRepository } from '@/server/repositories/group-invitations.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { randomBytes } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { isValidEmail, validateId, validateRequiredString } from '@/lib/utils/validation-utils';
import { financialTransaction } from '@/server/repositories/db-executor';
import { sql } from 'drizzle-orm';

export interface CreateInvitationInput {
  groupId: string;
  invitedByUserId: string;
  email: string;
}

/**
 * Creates a new group invitation
 * Validates email, checks for duplicates, generates secure token
 */
export async function createGroupInvitationUseCase(input: CreateInvitationInput) {
  const { groupId, invitedByUserId, email } = input;

  // Input validation
  validateId(groupId, 'Group ID');
  validateId(invitedByUserId, 'Invited by user ID');
  const emailTrimmed = validateRequiredString(email, 'Email');

  if (!isValidEmail(emailTrimmed)) {
    throw new Error('Invalid email format');
  }

  const emailLower = emailTrimmed.toLowerCase();

  const invitation = await financialTransaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`group-invitation:${groupId}:${emailLower}`}::text,0::bigint))`
    );
    const existingInvitation = await GroupInvitationsRepository.getActivePendingByEmailAndGroup(
      emailLower,
      groupId
    );
    if (existingInvitation) throw new Error('INVITATION_ALREADY_PENDING');

    const existingUser = await UsersRepository.findByEmail(emailLower);
    if (existingUser?.group_id === groupId) throw new Error('USER_ALREADY_MEMBER');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const created = await GroupInvitationsRepository.create({
      group_id: groupId,
      invited_by_user_id: invitedByUserId,
      email: emailLower,
      invitation_token: randomBytes(16).toString('hex'),
      expires_at: expiresAt,
      status: 'pending',
    });
    if (!created) throw new Error('Failed to create invitation');
    return created;
  });

  // Invalidate cache
  revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(groupId), 'max');

  return invitation;
}

export async function getGroupInvitationsByGroupUseCase(groupId: string) {
  validateId(groupId, 'Group ID');
  return await GroupInvitationsRepository.getByGroupId(groupId);
}

export async function deleteGroupInvitationUseCase(invitationId: string) {
  validateId(invitationId, 'Invitation ID');
  const invitation = await GroupInvitationsRepository.getById(invitationId);
  if (!invitation) throw new Error('Invitation not found');

  await GroupInvitationsRepository.delete(invitationId);

  revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(invitation.group_id), 'max');
}
