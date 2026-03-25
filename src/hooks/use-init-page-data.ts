'use client';

import { useEffect, useRef } from 'react';

/**
 * Sync server-fetched page data into a Zustand setter once per identity change.
 * Reduces duplicated useEffect boilerplate across dashboard feature hooks.
 */
export function useInitPageData<T>(data: T, setData: (d: T) => void, identity?: unknown): void {
  const prevIdentity = useRef(identity);

  useEffect(() => {
    if (identity !== undefined && identity === prevIdentity.current) {
      return;
    }
    prevIdentity.current = identity;
    setData(data);
  }, [data, setData, identity]);
}
