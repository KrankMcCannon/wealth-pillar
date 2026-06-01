import type { WebhookEvent } from '@clerk/nextjs/server';
import {
  ensureClerkIdentityStubUseCase,
  getUserByClerkIdUseCase,
  updateUserProfileUseCase,
  deleteUserUseCase,
} from '@/server/use-cases/users/user.use-cases';

/**
 * Main Clerk webhook handler
 * Routes events to appropriate handlers
 */
export async function handleClerkWebhook(evt: WebhookEvent) {
  const eventType = evt.type;

  switch (eventType) {
    case 'user.created':
      await handleUserCreated(evt);
      break;

    case 'user.updated':
      await handleUserUpdated(evt);
      break;

    case 'user.deleted':
      await handleUserDeleted(evt);
      break;

    default:
      break;
  }
}

/**
 * Handle user.created event — idempotent identity stub (onboarding assigns group_id).
 */
async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== 'user.created') return;

  const {
    id: clerkId,
    email_addresses: emailAddresses,
    first_name: firstName,
    last_name: lastName,
  } = evt.data;

  if (!clerkId) {
    console.error('[Webhook] No clerk ID in user.created event');
    return;
  }

  const primaryEmail = emailAddresses.find((e) => e.id === evt.data.primary_email_address_id);
  const email = primaryEmail?.email_address?.trim();
  if (!email) {
    console.error('[Webhook] No primary email in user.created event', { clerkId });
    return;
  }

  const name = `${firstName || ''} ${lastName || ''}`.trim() || email;

  await ensureClerkIdentityStubUseCase({ clerkId, email, name });
}

/**
 * Handle user.updated event
 * Updates user profile data (name, email) in Supabase
 */
async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== 'user.updated') return;

  const {
    id: clerkId,
    email_addresses: emailAddresses,
    first_name: firstName,
    last_name: lastName,
  } = evt.data;

  try {
    if (!clerkId) {
      console.error('[Webhook] No clerk ID in user.updated event');
      return;
    }

    const user = await getUserByClerkIdUseCase(clerkId);

    if (!user) {
      return;
    }

    const primaryEmail = emailAddresses.find((e) => e.id === evt.data.primary_email_address_id);
    const email = primaryEmail?.email_address || user.email;
    const name = `${firstName || ''} ${lastName || ''}`.trim() || user.name;

    await updateUserProfileUseCase(user.id, { name, email });
  } catch (error) {
    console.error('[Webhook] Error in handleUserUpdated:', {
      clerkId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Handle user.deleted event
 * Removes user from Supabase (cascades to all related data)
 */
async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== 'user.deleted') return;

  const { id: clerkId } = evt.data;

  try {
    if (!clerkId) {
      console.error('[Webhook] No clerk ID in user.deleted event');
      return;
    }

    const user = await getUserByClerkIdUseCase(clerkId);

    if (!user) {
      return;
    }

    await deleteUserUseCase(user.id);
  } catch (error) {
    console.error('[Webhook] Error in handleUserDeleted:', {
      clerkId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
