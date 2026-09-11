export const RETURN_TO_PARAM = 'from';

export function isSafeInternalPath(value: string): boolean {
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.includes('://')
  );
}

export function parseReturnTo(searchParams: Pick<URLSearchParams, 'get'>): string | undefined {
  const raw = searchParams.get(RETURN_TO_PARAM);
  if (!raw) return undefined;
  return isSafeInternalPath(raw) ? raw : undefined;
}

export function withReturnTo(href: string, from: string): string {
  if (!isSafeInternalPath(from)) return href;
  const url = new URL(href, 'http://local.test');
  url.searchParams.set(RETURN_TO_PARAM, from);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function pathWithoutReturnTo(pathname: string, search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete(RETURN_TO_PARAM);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
