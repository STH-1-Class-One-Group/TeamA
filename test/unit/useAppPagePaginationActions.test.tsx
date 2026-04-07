import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppPagePaginationActions } from '../../src/hooks/useAppPagePaginationActions';
import { createReviewFixture, myCommentFixture, myPageFixture, sessionUserFixture } from '../fixtures/app-fixtures';
import type { MyPageResponse, Review } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  getMyCommentsPage: vi.fn(),
  getReviewFeedPage: vi.fn(),
}));

import { getMyCommentsPage, getReviewFeedPage } from '../../src/api/client';

describe('useAppPagePaginationActions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('appends deduped summarized reviews when loading more feed items', async () => {
    let reviews: Review[] = [createReviewFixture({ id: 'review-1', comments: [] })];
    let feedNextCursor: string | null = 'cursor-1';
    let feedHasMore = true;
    let feedLoadingMore = false;

    vi.mocked(getReviewFeedPage).mockResolvedValue({
      items: [
        createReviewFixture({ id: 'review-1', comments: [myPageFixture.reviews[0].comments[0]] }),
        createReviewFixture({ id: 'review-2', comments: [myPageFixture.reviews[0].comments[0]], commentCount: 1 }),
      ],
      nextCursor: 'cursor-2',
    });

    const { result } = renderHook(() => useAppPagePaginationActions({
      sessionUser: sessionUserFixture,
      myPage: myPageFixture,
      feedNextCursor,
      feedHasMore,
      feedLoadingMore,
      myCommentsNextCursor: null,
      myCommentsHasMore: false,
      myCommentsLoadingMore: false,
      setReviews: (nextValue) => {
        reviews = typeof nextValue === 'function' ? nextValue(reviews) : nextValue;
      },
      setMyPage: vi.fn(),
      setFeedNextCursor: (nextValue) => {
        feedNextCursor = typeof nextValue === 'function' ? nextValue(feedNextCursor) : nextValue;
      },
      setFeedHasMore: (nextValue) => {
        feedHasMore = typeof nextValue === 'function' ? nextValue(feedHasMore) : nextValue;
      },
      setFeedLoadingMore: (nextValue) => {
        feedLoadingMore = typeof nextValue === 'function' ? nextValue(feedLoadingMore) : nextValue;
      },
      setMyCommentsNextCursor: vi.fn(),
      setMyCommentsHasMore: vi.fn(),
      setMyCommentsLoadingMore: vi.fn(),
      setMyCommentsLoadedOnce: vi.fn(),
      reportBackgroundError: vi.fn(),
    }));

    await act(async () => {
      await result.current.loadMoreFeedReviews();
    });

    expect(getReviewFeedPage).toHaveBeenCalledWith({ cursor: 'cursor-1', limit: 10 });
    expect(reviews).toHaveLength(2);
    expect(reviews[1]).toEqual({
      ...createReviewFixture({ id: 'review-2', comments: [myPageFixture.reviews[0].comments[0]], commentCount: 1 }),
      comments: [],
    });
    expect(feedNextCursor).toBe('cursor-2');
    expect(feedHasMore).toBe(true);
    expect(feedLoadingMore).toBe(false);
  });

  it('replaces my comments on initial load and appends deduped items otherwise', async () => {
    let myPage: MyPageResponse | null = {
      ...myPageFixture,
      comments: [myCommentFixture],
    };
    let myCommentsNextCursor: string | null = 'cursor-1';
    let myCommentsHasMore = true;
    let myCommentsLoadingMore = false;
    let myCommentsLoadedOnce = false;

    vi.mocked(getMyCommentsPage)
      .mockResolvedValueOnce({
        items: [{ ...myCommentFixture, id: 'comment-2', body: 'fresh' }],
        nextCursor: 'cursor-2',
      })
      .mockResolvedValueOnce({
        items: [{ ...myCommentFixture, id: 'comment-2', body: 'fresh' }, { ...myCommentFixture, id: 'comment-3', body: 'next' }],
        nextCursor: null,
      });

    const { result, rerender } = renderHook(() => useAppPagePaginationActions({
      sessionUser: sessionUserFixture,
      myPage,
      feedNextCursor: null,
      feedHasMore: false,
      feedLoadingMore: false,
      myCommentsNextCursor,
      myCommentsHasMore,
      myCommentsLoadingMore,
      setReviews: vi.fn(),
      setMyPage: (nextValue) => {
        myPage = typeof nextValue === 'function' ? nextValue(myPage) : nextValue;
      },
      setFeedNextCursor: vi.fn(),
      setFeedHasMore: vi.fn(),
      setFeedLoadingMore: vi.fn(),
      setMyCommentsNextCursor: (nextValue) => {
        myCommentsNextCursor = typeof nextValue === 'function' ? nextValue(myCommentsNextCursor) : nextValue;
      },
      setMyCommentsHasMore: (nextValue) => {
        myCommentsHasMore = typeof nextValue === 'function' ? nextValue(myCommentsHasMore) : nextValue;
      },
      setMyCommentsLoadingMore: (nextValue) => {
        myCommentsLoadingMore = typeof nextValue === 'function' ? nextValue(myCommentsLoadingMore) : nextValue;
      },
      setMyCommentsLoadedOnce: (nextValue) => {
        myCommentsLoadedOnce = typeof nextValue === 'function' ? nextValue(myCommentsLoadedOnce) : nextValue;
      },
      reportBackgroundError: vi.fn(),
    }));

    await act(async () => {
      await result.current.loadMoreMyComments(true);
    });
    expect(getMyCommentsPage).toHaveBeenNthCalledWith(1, { cursor: null, limit: 10 });
    expect(myPage?.comments.map((comment) => comment.id)).toEqual(['comment-2']);
    expect(myCommentsNextCursor).toBe('cursor-2');
    expect(myCommentsHasMore).toBe(true);
    expect(myCommentsLoadedOnce).toBe(true);
    rerender();

    await act(async () => {
      await result.current.loadMoreMyComments(false);
    });
    expect(getMyCommentsPage).toHaveBeenNthCalledWith(2, { cursor: 'cursor-2', limit: 10 });
    expect(myPage?.comments.map((comment) => comment.id)).toEqual(['comment-2', 'comment-3']);
    expect(myCommentsNextCursor).toBeNull();
    expect(myCommentsHasMore).toBe(false);
    expect(myCommentsLoadingMore).toBe(false);
  });
});
