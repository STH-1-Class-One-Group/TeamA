import { useReviewUIStore } from '../store/review-ui-store';

export function useReviewDomainState() {
  const feedPlaceFilterId = useReviewUIStore((state) => state.feedPlaceFilterId);
  const setFeedPlaceFilterId = useReviewUIStore((state) => state.setFeedPlaceFilterId);
  const activeCommentReviewId = useReviewUIStore((state) => state.activeCommentReviewId);
  const setActiveCommentReviewId = useReviewUIStore((state) => state.setActiveCommentReviewId);
  const highlightedCommentId = useReviewUIStore((state) => state.highlightedCommentId);
  const setHighlightedCommentId = useReviewUIStore((state) => state.setHighlightedCommentId);
  const highlightedReviewId = useReviewUIStore((state) => state.highlightedReviewId);
  const setHighlightedReviewId = useReviewUIStore((state) => state.setHighlightedReviewId);
  const highlightedRouteId = useReviewUIStore((state) => state.highlightedRouteId);
  const setHighlightedRouteId = useReviewUIStore((state) => state.setHighlightedRouteId);

  return {
    feedPlaceFilterId,
    setFeedPlaceFilterId,
    activeCommentReviewId,
    setActiveCommentReviewId,
    highlightedCommentId,
    setHighlightedCommentId,
    highlightedReviewId,
    setHighlightedReviewId,
    highlightedRouteId,
    setHighlightedRouteId,
  };
}
