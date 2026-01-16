import { WebhookEvent } from '@clerk/nextjs/server';
import { UserService } from '@/server/services';

/**
 * Main Clerk webhook handler
 * Routes events to appropriate handlers
 */
export async function handleClerkWebhook(evt: WebhookEvent) {
  const eventType = evt.type;

  console.log(`[Webhook] Received event: ${eventType}`, {
    userId: evt.data.id,
    timestamp: new Date().toISOString(),
  });

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
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
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
  if (evt.type !== 'user.created') return;

  const { id: clerkId, email_addresses } = evt.data;

  console.log('[Webhook] User created in Clerk', {
    clerkId,
    email: email_addresses[0]?.email_address,
    note: 'User will be created in Supabase during onboarding',
  });

  // User creation happens during onboarding when we have all required data
  // including group_id, accounts, and budgets
}

/**
 * Handle user.updated event
 * Updates user profile data (name, email) in Supabase
 */
async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== 'user.updated') return;

  const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

  console.log('[Webhook] Processing user.updated', {
    clerkId,
  });

  try {
    // Validate clerkId exists
    if (!clerkId) {
      console.error('[Webhook] No clerk ID in user.updated event');
      return;
    }

    // Get existing user
    const { data: user } = await UserService.getLoggedUserInfo(clerkId);

    if (!user) {
      console.log(
        `[Webhook] User ${clerkId} not found in Supabase, skipping update`
      );
      return;
    }

    // Get updated data
    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    );
    const email = primaryEmail?.email_address || user.email;
    const name = `${first_name || ''} ${last_name || ''}`.trim() || user.name;

    // Update user profile
    await UserService.updateProfile(user.id, { name, email });

    console.log('[Webhook] User updated successfully', {
      clerkId,
      userId: user.id,
    });
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

  console.log('[Webhook] Processing user.deleted', {
    clerkId,
  });

  try {
    // Validate clerkId exists
    if (!clerkId) {
      console.error('[Webhook] No clerk ID in user.deleted event');
      return;
    }

    // Get existing user
    const { data: user } = await UserService.getLoggedUserInfo(clerkId);

    if (!user) {
      console.log(
        `[Webhook] User ${clerkId} not found in Supabase, skipping deletion`
      );
      return;
    }

    // Delete user (cascades to all related data)
    await UserService.deleteUser(user.id);

    console.log('[Webhook] User deleted successfully', {
      clerkId,
      userId: user.id,
    });
  } catch (error) {
    console.error('[Webhook] Error in handleUserDeleted:', {
      clerkId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
