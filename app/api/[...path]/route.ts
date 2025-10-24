import { APIError, ErrorCode, withErrorHandler } from '@/src/lib';
import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const joined = path?.join('/') ?? '';

  if (!UPSTREAM_BASE) {
    throw new APIError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      'Servizio upstream non configurato.',
      { upstream_base: UPSTREAM_BASE }
    );
  }

  const url = new URL(request.url);
  const target = new URL(`${UPSTREAM_BASE}/${joined}${url.search}`);

  const init: RequestInit = {
    method: request.method,
    headers: new Headers(request.headers),
  };

  // Remove Next internal headers that upstream shouldn't receive
  (init.headers as Headers).delete('host');
  (init.headers as Headers).delete('x-forwarded-host');
  (init.headers as Headers).delete('x-forwarded-proto');

  // Only attach body for methods that support it
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.text();
      init.body = body;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      init.body = formData;
    } else {
      const body = await request.arrayBuffer();
      init.body = body;
    }
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch (error) {
    throw new APIError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      'Errore di connessione al servizio upstream.',
      { target: target.toString(), error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  if (!res.ok && res.status >= 500) {
    throw new APIError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      'Il servizio upstream ha restituito un errore.',
      { status: res.status, statusText: res.statusText }
    );
  }

  const resHeaders = new Headers(res.headers);

  // Stream or JSON-forward based on content type
  const contentType = resHeaders.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: resHeaders });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, { status: res.status, headers: resHeaders });
}

const wrappedProxy = withErrorHandler(proxy);

export {
  wrappedProxy as DELETE, wrappedProxy as GET, wrappedProxy as HEAD, wrappedProxy as OPTIONS, wrappedProxy as PATCH, wrappedProxy as POST, wrappedProxy as PUT
};

