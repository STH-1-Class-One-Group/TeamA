import { useMemo } from 'react';
import { useAutoLoadMore } from '../hooks/useAutoLoadMore';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { FeedLoadMoreRow } from './feed/FeedLoadMoreRow';
import { FeedTabHeader } from './feed/FeedTabHeader';
import { FeedCommentSheet } from './FeedCommentSheet';
import { ReviewList } from './ReviewList';
import type { ApiStatus, Comment, Review, SessionUser } from '../types';

interface FeedTabProps {
  feedData: {
    reviews: Review[];
    placeFilterId: string | null;
    placeFilterName: string | null;
    highlightedReviewId: string | null;
    reviewLikeUpdatingId: string | null;
    hasMore: boolean;
    loadingMore: boolean;
  };
  commentSheetData: {
    activeCommentReviewId: string | null;
    activeCommentReviewComments: Comment[];
    activeCommentReviewStatus: ApiStatus;
    highlightedCommentId: string | null;
    commentSubmittingReviewId: string | null;
    commentMutatingId: string | null;
    deletingReviewId: string | null;
  };
  sharedData: {
    sessionUser: SessionUser | null;
  };
  feedActions: {
    onLoadMore: () => Promise<void>;
    onToggleReviewLike: (reviewId: string) => Promise<void>;
    onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
    onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
    onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
    onDeleteReview: (reviewId: string) => Promise<void>;
    onClearPlaceFilter: () => void;
    onOpenComments: (reviewId: string, commentId?: string | null) => void;
    onCloseComments: () => void;
  };
  sharedActions: {
    onRequestLogin: () => void;
    onOpenPlace: (placeId: string) => void;
  };
}

export function FeedTab({
  feedData,
  commentSheetData,
  sharedData,
  feedActions,
  sharedActions,
}: FeedTabProps) {
  const {
    reviews,
    placeFilterId,
    placeFilterName,
    highlightedReviewId,
    reviewLikeUpdatingId,
    hasMore,
    loadingMore,
  } = feedData;
  const {
    activeCommentReviewId,
    activeCommentReviewComments,
    activeCommentReviewStatus,
    highlightedCommentId,
    commentSubmittingReviewId,
    commentMutatingId,
    deletingReviewId,
  } = commentSheetData;
  const { sessionUser } = sharedData;
  const {
    onLoadMore,
    onToggleReviewLike,
    onCreateComment,
    onUpdateComment,
    onDeleteComment,
    onDeleteReview,
    onClearPlaceFilter,
    onOpenComments,
    onCloseComments,
  } = feedActions;
  const { onRequestLogin, onOpenPlace } = sharedActions;

  const skipFeedScrollRestore = Boolean(highlightedReviewId || activeCommentReviewId || highlightedCommentId);
  const scrollRef = useScrollRestoration<HTMLElement>(`feed:${placeFilterId ?? 'all'}`, { skipRestore: skipFeedScrollRestore });
  const loadMoreRef = useAutoLoadMore({
    enabled: hasMore && !placeFilterId,
    loading: loadingMore,
    onLoadMore,
    rootRef: scrollRef,
  });
  const visibleReviews = useMemo(
    () => (placeFilterId ? reviews.filter((review) => review.placeId === placeFilterId) : reviews),
    [placeFilterId, reviews],
  );
  const activeReview = reviews.find((review) => review.id === activeCommentReviewId) ?? null;

  return (
    <>
      <section ref={scrollRef} className="page-panel page-panel--scrollable">
        <FeedTabHeader placeFilterName={placeFilterName} onClearPlaceFilter={onClearPlaceFilter} />
        <ReviewList
          reviews={visibleReviews}
          canWriteComment={Boolean(sessionUser)}
          canToggleLike={Boolean(sessionUser)}
          currentUserId={sessionUser?.id ?? null}
          highlightedReviewId={highlightedReviewId}
          likingReviewId={reviewLikeUpdatingId}
          submittingReviewId={commentSubmittingReviewId}
          onToggleLike={onToggleReviewLike}
          onSubmitComment={onCreateComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onDeleteReview={onDeleteReview}
          onRequestLogin={onRequestLogin}
          onOpenPlace={onOpenPlace}
          onOpenComments={(reviewId) => onOpenComments(reviewId)}
          emptyTitle={placeFilterId ? `${placeFilterName} 피드가 아직 없어요` : '아직 공개된 피드가 없어요'}
          emptyBody={placeFilterId ? '이 장소를 찍은 뒤 첫 피드를 남겨 보세요.' : '먼저 스탬프를 찍고 오늘의 분위기를 짧게 남겨 보세요.'}
        />
        <FeedLoadMoreRow hasMore={hasMore} loadingMore={loadingMore} loadMoreRef={loadMoreRef} onLoadMore={onLoadMore} />
      </section>
      <FeedCommentSheet
        review={activeReview}
        comments={activeCommentReviewComments}
        commentsStatus={activeCommentReviewStatus}
        isOpen={activeCommentReviewId !== null}
        canWriteComment={Boolean(sessionUser)}
        currentUserId={sessionUser?.id ?? null}
        submittingReviewId={commentSubmittingReviewId}
        mutatingCommentId={commentMutatingId}
        deletingReviewId={deletingReviewId}
        highlightedCommentId={highlightedCommentId}
        onClose={onCloseComments}
        onSubmitComment={onCreateComment}
        onUpdateComment={onUpdateComment}
        onDeleteComment={onDeleteComment}
        onDeleteReview={onDeleteReview}
        onRequestLogin={onRequestLogin}
      />
    </>
  );
}
