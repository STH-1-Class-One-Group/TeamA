import { toggleReviewLike } from '../api/reviewsClient';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import type { UseAppReviewActionsParams } from './useAppReviewActions.types';

export function useAppReviewLikeActions({
  sessionUser,
  reviews,
  selectedPlaceReviews,
  myPage,
  setNotice,
  goToTab,
  patchReviewCollections,
  formatErrorMessage,
}: UseAppReviewActionsParams) {
  const setReviewLikeUpdatingId = useAppPageRuntimeStore((state) => state.setReviewLikeUpdatingId);

  async function handleToggleReviewLike(reviewId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('좋아요를 누르려면 먼저 로그인해 주세요.');
      return;
    }

    const targetReview = reviews.find((review) => review.id === reviewId)
      ?? selectedPlaceReviews.find((review) => review.id === reviewId)
      ?? myPage?.reviews.find((review) => review.id === reviewId)
      ?? null;
    const previousLikedByMe = targetReview?.likedByMe ?? false;
    const previousLikeCount = targetReview?.likeCount ?? 0;
    const optimisticLikedByMe = !previousLikedByMe;
    const optimisticLikeCount = Math.max(0, previousLikeCount + (optimisticLikedByMe ? 1 : -1));

    patchReviewCollections(reviewId, (review) => ({
      ...review,
      likeCount: optimisticLikeCount,
      likedByMe: optimisticLikedByMe,
    }));

    setReviewLikeUpdatingId(reviewId);
    try {
      const result = await toggleReviewLike(reviewId);
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        likeCount: result.likeCount,
        likedByMe: result.likedByMe,
      }));
    } catch (error) {
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        likeCount: previousLikeCount,
        likedByMe: previousLikedByMe,
      }));
      setNotice(formatErrorMessage(error));
    } finally {
      setReviewLikeUpdatingId(null);
    }
  }

  return {
    handleToggleReviewLike,
  };
}
