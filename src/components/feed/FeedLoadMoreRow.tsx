import type { RefObject } from 'react';

interface FeedLoadMoreRowProps {
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreRef: RefObject<HTMLDivElement>;
  onLoadMore: () => Promise<void>;
}

export function FeedLoadMoreRow({
  hasMore,
  loadingMore,
  loadMoreRef,
  onLoadMore,
}: FeedLoadMoreRowProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="list-load-more-row">
      <div ref={loadMoreRef} className="list-load-more-sentinel" aria-hidden="true" />
      <button type="button" className="secondary-button" onClick={() => void onLoadMore()} disabled={loadingMore}>
        {loadingMore ? 'Loading...' : 'More feed'}
      </button>
    </div>
  );
}
