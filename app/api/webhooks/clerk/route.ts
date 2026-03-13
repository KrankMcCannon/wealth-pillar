import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { handleClerkWebhook } from '@/lib/webhooks/clerk-webhook-handler';

/**
 * Clerk Webhook Endpoint
 *
 * Handles Clerk webhook events for automatic user synchronization with Supabase.
 *
 * Supported events:
 * - user.created: Creates user record in Supabase
 * - user.updated: Updates user data in Supabase
 * - user.deleted: Removes user from Supabase
 *
 * Security:
 * - Verifies webhook signature using svix
 * - Requires CLERK_WEBHOOK_SECRET environment variable
 *
 * Configuration:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy webhook secret to .env as CLERK_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle the webhook — always return 200 to avoid Clerk retries; log errors internally
  try {
    await handleClerkWebhook(evt);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const clerkId = evt?.data?.id ?? undefined;
    const logPayload = {
      eventType: evt?.type,
      clerkId,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    console.error(
      '[Clerk Webhook] Processing failed (returning 200 to avoid retries):',
      JSON.stringify(logPayload)
    );
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
