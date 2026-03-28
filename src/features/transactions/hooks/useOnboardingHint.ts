'use client';

import { useSyncExternalStore, useCallback } from 'react';

const DISMISS_KEY = 'onboarding-transactions-v1-dismissed';
const SYNC_EVENT = 'onboarding-transactions-sync';

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (e.key === DISMISS_KEY) onStoreChange();
  };
  const handleLocalSync = () => onStoreChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(SYNC_EVENT, handleLocalSync);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SYNC_EVENT, handleLocalSync);
  };
}

function getSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DISMISS_KEY) === 'true';
}

function getServerSnapshot() {
  return false;
}

/**
 * Hook to manage the transactions page onboarding hint.
 * Uses useSyncExternalStore so the dismissed state stays in sync
 * across browser tabs via the storage event.
 */
export function useOnboardingHint() {
  const isDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, 'true');
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  return { showHint: !isDismissed, dismiss };
}
