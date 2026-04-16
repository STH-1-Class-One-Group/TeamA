import { getReviewDetail } from '../../api/reviewsClient';
import type { SnapshotReturnView, UseAppNavigationHelpersParams } from './navigationTypes';
import { formatNavigationErrorMessage } from './navigationTypes';

interface ReviewNavigationParams
  extends Pick<
    UseAppNavigationHelpersParams,
    | 'activeTab'
    | 'reviews'
    | 'selectedPlaceReviews'
    | 'myPageReviews'
    | 'goToTab'
    | 'setActiveCommentReviewId'
    | 'setHighlightedCommentId'
    | 'setHighlightedReviewId'
    | 'setFeedPlaceFilterId'
    | 'setReturnView'
    | 'setNotice'
    | 'upsertReviewCollections'
  > {
  snapshotReturnView: SnapshotReturnView;
}

export function createReviewNavigationHelpers({
  activeTab,
  reviews,
  selectedPlaceReviews,
  myPageReviews,
  goToTab,
  setActiveCommentReviewId,
  setHighlightedCommentId,
  setHighlightedReviewId,
  setFeedPlaceFilterId,
  setReturnView,
  setNotice,
  upsertReviewCollections,
  snapshotReturnView,
}: ReviewNavigationParams) {
  function handleOpenReviewComments(reviewId: string, commentId: string | null = null) {
    goToTab('feed');
    setHighlightedReviewId(reviewId ?? null);
    setActiveCommentReviewId(reviewId);
    setHighlightedCommentId(commentId);
  }

  function handleCloseReviewComments() {
    setActiveCommentReviewId(null);
    setHighlightedCommentId(null);
  }

  async function ensureReviewLoadedById(reviewId: string | null) {
    if (!reviewId) {
      return null;
    }

    const existing =
      [...reviews, ...selectedPlaceReviews, ...myPageReviews].find((review) => review.id === reviewId) ?? null;
    if (existing) {
      upsertReviewCollections(existing);
      return existing;
    }

    try {
      const loaded = await getReviewDetail(reviewId);
      upsertReviewCollections(loaded);
      return loaded;
    } catch (error) {
      setNotice(formatNavigationErrorMessage(error));
      return null;
    }
  }

  async function handleOpenReviewWithReturn(reviewId: string | null) {
    await ensureReviewLoadedById(reviewId);
    if (activeTab !== 'feed') {
      setReturnView(snapshotReturnView());
    }
    setFeedPlaceFilterId(null);
    setHighlightedReviewId(reviewId);
    setHighlightedCommentId(null);
    setActiveCommentReviewId(null);
    goToTab('feed');
  }

  function handleOpenPlaceFeedWithReturn(placeId: string) {
    if (activeTab !== 'feed') {
      setReturnView(snapshotReturnView());
    }
    setFeedPlaceFilterId(placeId);
    setHighlightedReviewId(null);
    setHighlightedCommentId(null);
    setActiveCommentReviewId(null);
    goToTab('feed');
  }

  async function handleOpenCommentWithReturn(reviewId: string, commentId: string | null = null) {
    if (activeTab !== 'feed') {
      setReturnView(snapshotReturnView());
    }
    await ensureReviewLoadedById(reviewId);
    handleOpenReviewComments(reviewId, commentId);
  }

  return {
    handleOpenReviewComments,
    handleCloseReviewComments,
    handleOpenReviewWithReturn,
    handleOpenPlaceFeedWithReturn,
    handleOpenCommentWithReturn,
  };
}
