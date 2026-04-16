import { useRef } from 'react';
import type { Review } from '../types';
import { ReviewListEmptyState } from './review/ReviewListEmptyState';
import { ReviewListItem } from './review/ReviewListItem';
import { useScrollToHighlightedReview } from './review/useScrollToHighlightedReview';

interface ReviewListProps {
  reviews: Review[];
  canWriteComment: boolean;
  canToggleLike: boolean;
  currentUserId?: string | null;
  highlightedReviewId?: string | null;
  likingReviewId: string | null;
  submittingReviewId: string | null;
  onToggleLike: (reviewId: string) => Promise<void>;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  onRequestLogin: () => void;
  onOpenPlace?: (placeId: string) => void;
  onOpenComments?: (reviewId: string) => void;
  emptyTitle: string;
  emptyBody: string;
}

export function ReviewList({
  reviews,
  canWriteComment,
  canToggleLike,
  currentUserId = null,
  highlightedReviewId = null,
  likingReviewId,
  submittingReviewId,
  onToggleLike,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onDeleteReview: _onDeleteReview,
  onRequestLogin,
  onOpenPlace,
  onOpenComments,
  emptyTitle,
  emptyBody,
}: ReviewListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  useScrollToHighlightedReview(listRef, highlightedReviewId, reviews.length);

  if (reviews.length === 0) {
    return <ReviewListEmptyState emptyTitle={emptyTitle} emptyBody={emptyBody} />;
  }

  return (
    <div ref={listRef} className="review-stack">
      {reviews.map((review) => (
        <ReviewListItem
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          highlightedReviewId={highlightedReviewId}
          canWriteComment={canWriteComment}
          canToggleLike={canToggleLike}
          likingReviewId={likingReviewId}
          submittingReviewId={submittingReviewId}
          onToggleLike={onToggleLike}
          onSubmitComment={onSubmitComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onRequestLogin={onRequestLogin}
          onOpenPlace={onOpenPlace}
          onOpenComments={onOpenComments}
        />
      ))}
    </div>
  );
}
