import { useEffect } from 'react';

export function useScrollToHighlightedReview(
  listRef: React.RefObject<HTMLDivElement | null>,
  highlightedReviewId: string | null,
  reviewCount: number,
) {
  useEffect(() => {
    if (!highlightedReviewId) {
      return;
    }

    const listEl = listRef.current;
    if (!listEl) {
      return;
    }

    const selector = `[data-review-id="${highlightedReviewId}"]`;
    const scrollToReview = () => {
      const target = listEl.querySelector<HTMLElement>(selector);
      if (!target) {
        return;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    scrollToReview();
    const rafA = window.requestAnimationFrame(scrollToReview);
    const rafB = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToReview);
    });

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
    };
  }, [highlightedReviewId, reviewCount, listRef]);
}
