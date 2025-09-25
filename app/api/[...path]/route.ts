import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const joined = path?.join('/') ?? '';

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

  const res = await fetch(target, init);
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

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE, proxy as OPTIONS, proxy as HEAD };
