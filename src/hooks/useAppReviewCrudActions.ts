import {
  createReview,
  deleteReview,
  updateReview,
  uploadReviewImage,
} from '../api/reviewsClient';
import { toReviewSummary } from '../lib/reviews';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import { useReviewUIStore } from '../store/review-ui-store';
import type { ReviewMood } from '../types';
import type { UseAppReviewActionsParams } from './useAppReviewActions.types';

export function useAppReviewCrudActions({
  activeTab,
  sessionUser,
  selectedPlace,
  activeCommentReviewId,
  highlightedReviewId,
  setSelectedPlaceReviews,
  setReviews,
  setMyPage,
  setNotice,
  goToTab,
  commitRouteState,
  refreshMyPageForUser,
  patchReviewCollections,
  upsertReviewCollections,
  placeReviewsCacheRef,
  handleCloseReviewComments,
  clearReviewComments,
  formatErrorMessage,
}: UseAppReviewActionsParams) {
  const setReviewSubmitting = useAppPageRuntimeStore((state) => state.setReviewSubmitting);
  const setReviewError = useAppPageRuntimeStore((state) => state.setReviewError);
  const setDeletingReviewId = useAppPageRuntimeStore((state) => state.setDeletingReviewId);
  const setHighlightedReviewId = useReviewUIStore((state) => state.setHighlightedReviewId);

  async function handleCreateReview(payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) {
    if (!sessionUser || !selectedPlace) {
      goToTab('my');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      let imageUrl: string | null = null;
      if (payload.file) {
        const uploaded = await uploadReviewImage(payload.file);
        imageUrl = uploaded.url;
      }
      const createdReview = await createReview({
        placeId: selectedPlace.id,
        stampId: payload.stampId,
        body: payload.body.trim(),
        mood: payload.mood,
        imageUrl,
      });
      upsertReviewCollections(createdReview);
      await refreshMyPageForUser(sessionUser);
      setNotice('피드를 남겼어요. 이제 다른 장소도 이어서 둘러볼 수 있어요.');
      commitRouteState(
        {
          tab: 'map',
          placeId: selectedPlace.id,
          festivalId: null,
          drawerState: 'full',
        },
        'replace',
      );
    } catch (error) {
      setReviewError(formatErrorMessage(error));
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleUpdateReview(
    reviewId: string,
    payload: { body: string; mood: ReviewMood; file?: File | null; removeImage?: boolean },
  ) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('피드를 수정하려면 먼저 로그인해 주세요.');
      return;
    }

    let imageUrl: string | null | undefined;
    if (payload.file) {
      const uploaded = await uploadReviewImage(payload.file);
      imageUrl = uploaded.url;
    } else if (payload.removeImage) {
      imageUrl = null;
    }

    const updatedReview = await updateReview(reviewId, {
      body: payload.body.trim(),
      mood: payload.mood,
      imageUrl,
    });
    const summarizedReview = toReviewSummary(updatedReview);
    patchReviewCollections(reviewId, () => summarizedReview);
    setMyPage((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        reviews: current.reviews.map((review) => (review.id === reviewId ? summarizedReview : review)),
        comments: current.comments.map((comment) => (
          comment.reviewId === reviewId
            ? { ...comment, reviewBody: updatedReview.body }
            : comment
        )),
      };
    });
    setNotice('피드를 수정했어요.');
  }

  async function handleDeleteReview(reviewId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('피드를 삭제하려면 먼저 로그인해 주세요.');
      return;
    }
    if (!window.confirm('이 피드를 삭제할까요?')) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      await deleteReview(reviewId);
      clearReviewComments(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setSelectedPlaceReviews((current) => current.filter((review) => review.id !== reviewId));
      for (const placeId of Object.keys(placeReviewsCacheRef.current)) {
        placeReviewsCacheRef.current[placeId] = placeReviewsCacheRef.current[placeId].filter((review) => review.id !== reviewId);
      }
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          reviews: current.reviews.filter((review) => review.id !== reviewId),
          comments: current.comments.filter((comment) => comment.reviewId !== reviewId),
          stats: {
            ...current.stats,
            reviewCount: Math.max(0, current.stats.reviewCount - 1),
          },
        };
      });
      if (activeCommentReviewId === reviewId) {
        handleCloseReviewComments();
      }
      if (highlightedReviewId === reviewId) {
        setHighlightedReviewId(null);
      }
      setNotice('피드를 삭제했어요.');
      if (activeTab === 'my') {
        await refreshMyPageForUser(sessionUser, true);
      }
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setDeletingReviewId(null);
    }
  }

  return {
    handleCreateReview,
    handleUpdateReview,
    handleDeleteReview,
  };
}
