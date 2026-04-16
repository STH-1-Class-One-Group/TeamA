import { useRef, useState } from 'react';
import { toReviewSummary } from '../../lib/reviews';
import type { BootstrapResponse } from '../../types';

type ReviewSummary = BootstrapResponse['reviews'][number];

export function useReviewCollectionState(selectedPlaceId: string | null) {
  const [reviews, setReviews] = useState<BootstrapResponse['reviews']>([]);
  const [selectedPlaceReviews, setSelectedPlaceReviews] = useState<BootstrapResponse['reviews']>([]);
  const placeReviewsCacheRef = useRef<Record<string, BootstrapResponse['reviews']>>({});
  const feedLoadedRef = useRef(false);
  const coursesLoadedRef = useRef(false);

  function patchReviewCollections(reviewId: string, updater: (review: ReviewSummary) => ReviewSummary) {
    setReviews((current) => current.map((review) => (review.id === reviewId ? toReviewSummary(updater(review)) : review)));
    setSelectedPlaceReviews((current) =>
      current.map((review) => (review.id === reviewId ? toReviewSummary(updater(review)) : review)),
    );
    for (const placeId of Object.keys(placeReviewsCacheRef.current)) {
      placeReviewsCacheRef.current[placeId] = placeReviewsCacheRef.current[placeId].map((review) =>
        review.id === reviewId ? toReviewSummary(updater(review)) : review,
      );
    }
  }

  function upsertReviewCollections(review: ReviewSummary) {
    const nextReview = toReviewSummary(review);
    setReviews((current) => [nextReview, ...current.filter((currentReview) => currentReview.id !== review.id)]);
    if (selectedPlaceId === review.placeId) {
      setSelectedPlaceReviews((current) => [
        nextReview,
        ...current.filter((currentReview) => currentReview.id !== review.id),
      ]);
    }
    const cachedPlaceReviews = placeReviewsCacheRef.current[review.placeId] ?? [];
    placeReviewsCacheRef.current[review.placeId] = [
      nextReview,
      ...cachedPlaceReviews.filter((currentReview) => currentReview.id !== review.id),
    ];
  }

  function resetReviewCaches() {
    placeReviewsCacheRef.current = {};
    feedLoadedRef.current = false;
    coursesLoadedRef.current = false;
    setSelectedPlaceReviews([]);
  }

  return {
    reviews,
    setReviews,
    selectedPlaceReviews,
    setSelectedPlaceReviews,
    placeReviewsCacheRef,
    feedLoadedRef,
    coursesLoadedRef,
    patchReviewCollections,
    upsertReviewCollections,
    resetReviewCaches,
  };
}
