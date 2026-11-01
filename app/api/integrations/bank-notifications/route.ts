import { notificationSchema } from '@/lib/bank-notifications/parser';
import {
  ingestBankNotification,
  NotificationError,
} from '@/server/use-cases/bank-notifications/notification-service';

const MAX_BYTES = 16_384;
const headers = { 'Cache-Control': 'no-store' };
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer wpn_')) throw new NotificationError('unauthorized', 401);
    if (
      request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
      'application/json'
    )
      throw new NotificationError('invalid_content_type', 415);
    if (Number(request.headers.get('content-length')) > MAX_BYTES)
      throw new NotificationError('payload_too_large', 413);
    const reader = request.body?.getReader();
    if (!reader) throw new NotificationError('invalid_payload');
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) {
          await reader.cancel();
          throw new NotificationError('payload_too_large', 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const input = notificationSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!input.success) throw new NotificationError('invalid_payload');
    const result = await ingestBankNotification(authorization.slice(7), input.data);
    return Response.json(result, { status: result.duplicate ? 200 : 201, headers });
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json({ error: 'invalid_payload' }, { status: 400, headers });
    if (error instanceof NotificationError)
      return Response.json(
        { error: error.code },
        {
          status: error.status,
          headers: { ...headers, ...(error.status === 429 ? { 'Retry-After': '60' } : {}) },
        }
      );
    // No payloads, account data or device credentials in logs or error responses.
    console.error('Bank notification import failed');
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503, headers });
  }
}
