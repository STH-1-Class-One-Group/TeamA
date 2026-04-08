import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppDataState } from '../../src/hooks/useAppDataState';
import { createReviewFixture } from '../fixtures/app-fixtures';

describe('useAppDataState', () => {
  it('keeps patched review collections summary-only across selected-place caches', () => {
    const review = createReviewFixture({
      id: 'review-1',
      placeId: 'place-1',
      commentCount: 1,
      comments: [],
    });
    const detailedReview = {
      ...review,
      commentCount: 2,
      comments: [
        {
          id: 'comment-1',
          userId: 'user-2',
          author: 'tester-2',
          body: 'embedded',
          parentId: null,
          isDeleted: false,
          createdAt: '04. 08. 10:15',
          replies: [],
        },
      ],
    };

    const { result } = renderHook(() => useAppDataState('place-1'));

    act(() => {
      result.current.setReviews([review]);
      result.current.setSelectedPlaceReviews([review]);
      result.current.placeReviewsCacheRef.current['place-1'] = [review];
    });

    act(() => {
      result.current.patchReviewCollections('review-1', () => detailedReview);
    });

    expect(result.current.reviews[0]).toEqual({
      ...detailedReview,
      comments: [],
    });
    expect(result.current.selectedPlaceReviews[0]).toEqual({
      ...detailedReview,
      comments: [],
    });
    expect(result.current.placeReviewsCacheRef.current['place-1']?.[0]).toEqual({
      ...detailedReview,
      comments: [],
    });
  });

  it('only upserts selected-place reviews for the active place while keeping cache entries summarized', () => {
    const review = createReviewFixture({
      id: 'review-2',
      placeId: 'place-2',
      commentCount: 2,
      comments: [
        {
          id: 'comment-2',
          userId: 'user-3',
          author: 'tester-3',
          body: 'embedded',
          parentId: null,
          isDeleted: false,
          createdAt: '04. 08. 11:15',
          replies: [],
        },
      ],
    });

    const { result } = renderHook(() => useAppDataState('place-1'));

    act(() => {
      result.current.upsertReviewCollections(review);
    });

    expect(result.current.reviews[0]).toEqual({
      ...review,
      comments: [],
    });
    expect(result.current.selectedPlaceReviews).toEqual([]);
    expect(result.current.placeReviewsCacheRef.current['place-2']?.[0]).toEqual({
      ...review,
      comments: [],
    });
  });
});
