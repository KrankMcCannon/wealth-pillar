import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import type { User } from '@/lib/types';
import { updateUserProfileUseCase } from './user.use-cases';

const updatesSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

/** Clerk owns identity. The local profile only accepts its verified primary address. */
export async function syncProfileWithClerkUseCase(
  user: User,
  input: { name?: string | undefined; email?: string | undefined }
) {
  const updates = updatesSchema.parse(input);
  if (!user.clerk_id) throw new Error('Clerk identity not found');
  const client = await clerkClient();
  let identity = await client.users.getUser(user.clerk_id);
  const primary = identity.emailAddresses.find(
    (email) => email.id === identity.primaryEmailAddressId
  );
  if (!primary || primary.verification?.status !== 'verified') {
    throw new Error('Verify your primary email in Clerk before saving.');
  }
  if (updates.email !== undefined && updates.email !== primary.emailAddress.toLowerCase()) {
    throw new Error('Verify the new email and make it primary before saving.');
  }
  if (updates.name !== undefined) {
    identity = await client.users.updateUser(user.clerk_id, {
      firstName: updates.name,
      lastName: '',
    });
  }
  return updateUserProfileUseCase(user.id, {
    name:
      [identity.firstName, identity.lastName].filter(Boolean).join(' ').trim() ||
      user.name ||
      primary.emailAddress,
    email: primary.emailAddress.toLowerCase(),
  });
}
