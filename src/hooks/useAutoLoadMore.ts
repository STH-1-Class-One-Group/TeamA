import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

interface UseAutoLoadMoreOptions {
  enabled: boolean;
  loading: boolean;
  onLoadMore: () => Promise<void> | void;
  rootRef: RefObject<HTMLElement | null>;
  rootMargin?: string;
}

export function useAutoLoadMore({
  enabled,
  loading,
  onLoadMore,
  rootRef,
  rootMargin = '160px 0px',
}: UseAutoLoadMoreOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || loading || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    let requested = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (requested) {
          return;
        }

        if (entries.some((entry) => entry.isIntersecting)) {
          requested = true;
          void onLoadMore();
        }
      },
      {
        root: rootRef.current,
        rootMargin,
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => {
      requested = true;
      observer.disconnect();
    };
  }, [enabled, loading, onLoadMore, rootMargin, rootRef]);

  return sentinelRef;
}
