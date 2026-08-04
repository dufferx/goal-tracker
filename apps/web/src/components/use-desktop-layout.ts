import { useSyncExternalStore } from 'react';

const query = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function snapshot() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches);
}

export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
