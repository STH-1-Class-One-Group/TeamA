import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppPagePaginationActions } from '../../src/hooks/useAppPagePaginationActions';
import { useAppPageRuntimeStore } from '../../src/store/app-page-runtime-store';
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
    useAppPageRuntimeStore.setState({
      feedNextCursor: null,
      feedHasMore: false,
      feedLoadingMore: false,
      myCommentsNextCursor: null,
      myCommentsHasMore: false,
      myCommentsLoadingMore: false,
      myCommentsLoadedOnce: false,
    });
  });

  it('appends deduped summarized reviews when loading more feed items', async () => {
    let reviews: Review[] = [createReviewFixture({ id: 'review-1', comments: [] })];
    useAppPageRuntimeStore.setState({
      feedNextCursor: 'cursor-1',
      feedHasMore: true,
      feedLoadingMore: false,
    });

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
      setReviews: (nextValue) => {
        reviews = typeof nextValue === 'function' ? nextValue(reviews) : nextValue;
      },
      setMyPage: vi.fn(),
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
    expect(useAppPageRuntimeStore.getState().feedNextCursor).toBe('cursor-2');
    expect(useAppPageRuntimeStore.getState().feedHasMore).toBe(true);
    expect(useAppPageRuntimeStore.getState().feedLoadingMore).toBe(false);
  });

  it('replaces my comments on initial load and appends deduped items otherwise', async () => {
    let myPage: MyPageResponse | null = {
      ...myPageFixture,
      comments: [myCommentFixture],
    };
    useAppPageRuntimeStore.setState({
      myCommentsNextCursor: 'cursor-1',
      myCommentsHasMore: true,
      myCommentsLoadingMore: false,
      myCommentsLoadedOnce: false,
    });

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
      setReviews: vi.fn(),
      setMyPage: (nextValue) => {
        myPage = typeof nextValue === 'function' ? nextValue(myPage) : nextValue;
      },
      reportBackgroundError: vi.fn(),
    }));

    await act(async () => {
      await result.current.loadMoreMyComments(true);
    });
    expect(getMyCommentsPage).toHaveBeenNthCalledWith(1, { cursor: null, limit: 10 });
    expect(myPage?.comments.map((comment) => comment.id)).toEqual(['comment-2']);
    expect(useAppPageRuntimeStore.getState().myCommentsNextCursor).toBe('cursor-2');
    expect(useAppPageRuntimeStore.getState().myCommentsHasMore).toBe(true);
    expect(useAppPageRuntimeStore.getState().myCommentsLoadedOnce).toBe(true);
    rerender();

    await act(async () => {
      await result.current.loadMoreMyComments(false);
    });
    expect(getMyCommentsPage).toHaveBeenNthCalledWith(2, { cursor: 'cursor-2', limit: 10 });
    expect(myPage?.comments.map((comment) => comment.id)).toEqual(['comment-2', 'comment-3']);
    expect(useAppPageRuntimeStore.getState().myCommentsNextCursor).toBeNull();
    expect(useAppPageRuntimeStore.getState().myCommentsHasMore).toBe(false);
    expect(useAppPageRuntimeStore.getState().myCommentsLoadingMore).toBe(false);
  });
});
