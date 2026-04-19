import { GroupInvitationsRepository } from '@/server/repositories/group-invitations.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { randomBytes } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { isValidEmail, validateId, validateRequiredString } from '@/lib/utils/validation-utils';

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

  // Check for existing pending invitation
  const existingInvitation = await GroupInvitationsRepository.getByEmailAndGroup(
    emailLower,
    groupId
  );
  if (existingInvitation && existingInvitation.status === 'pending') {
    throw new Error('An invitation has already been sent to this email');
  }

  // Check if user is already in the group
  const existingUser = await UsersRepository.findByEmail(emailLower);
  if (existingUser?.group_id === groupId) {
    throw new Error('This user is already a member of the group');
  }

  // Generate secure invitation token
  const invitationToken = randomBytes(16).toString('hex');

  // Calculate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create invitation
  const invitation = await GroupInvitationsRepository.create({
    group_id: groupId,
    invited_by_user_id: invitedByUserId,
    email: emailLower,
    invitation_token: invitationToken,
    expires_at: expiresAt,
    status: 'pending',
  });

  if (!invitation) {
    throw new Error('Failed to create invitation');
  }

  // Invalidate cache
  revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
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

  revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
  revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(invitation.group_id), 'max');
}
