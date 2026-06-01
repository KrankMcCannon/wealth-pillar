import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { handleClerkWebhook } from '@/lib/webhooks/clerk-webhook-handler';

/**
 * Clerk Webhook Endpoint
 *
 * Handles Clerk webhook events for automatic user synchronization with Supabase.
 *
 * Supported events:
 * - user.created: Idempotent identity stub (group assigned during onboarding)
 * - user.updated: Updates user data in Supabase
 * - user.deleted: Removes user from Supabase
 */
export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!signingSecret) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
  }

  let evt;
  try {
    evt = await verifyWebhook(req as Parameters<typeof verifyWebhook>[0], { signingSecret });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Invalid signature', { status: 400 });
  }

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
