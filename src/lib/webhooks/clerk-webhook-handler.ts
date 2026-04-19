import { WebhookEvent } from '@clerk/nextjs/server';
import {
  getUserByClerkIdUseCase,
  updateUserProfileUseCase,
  deleteUserUseCase,
} from '@/server/use-cases';

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
 * Handle user.created event
 *
 * NOTE: We don't create the user record here because the database schema
 * requires a group_id, which is only created during onboarding.
 * User creation happens in the onboarding flow.
 *
 * This webhook just logs the event for monitoring purposes.
 */
async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type === 'user.created') {
    // User creation happens in onboarding; this webhook is for monitoring only
  }
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
    // Validate clerkId exists
    if (!clerkId) {
      console.error('[Webhook] No clerk ID in user.updated event');
      return;
    }

    // Get existing user
    const user = await getUserByClerkIdUseCase(clerkId);

    if (!user) {
      return;
    }

    // Get updated data
    const primaryEmail = emailAddresses.find((e) => e.id === evt.data.primary_email_address_id);
    const email = primaryEmail?.email_address || user.email;
    const name = `${firstName || ''} ${lastName || ''}`.trim() || user.name;

    // Update user profile
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
    // Validate clerkId exists
    if (!clerkId) {
      console.error('[Webhook] No clerk ID in user.deleted event');
      return;
    }

    // Get existing user
    const user = await getUserByClerkIdUseCase(clerkId);

    if (!user) {
      return;
    }

    // Delete user (cascades to all related data)
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
