import { CommentThread } from '../CommentThread';
import type { Review } from '../../types';
import { CommentIcon, HeartIcon } from './ReviewActionIcons';
import { ReviewFeedCardHeader } from './ReviewFeedCardHeader';
import { ReviewImageFrame } from './ReviewImageFrame';
import { ReviewTagRow } from './ReviewTagRow';

interface ReviewListItemProps {
  review: Review;
  currentUserId: string | null;
  highlightedReviewId: string | null;
  canWriteComment: boolean;
  canToggleLike: boolean;
  likingReviewId: string | null;
  submittingReviewId: string | null;
  onToggleLike: (reviewId: string) => Promise<void>;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onRequestLogin: () => void;
  onOpenPlace?: (placeId: string) => void;
  onOpenComments?: (reviewId: string) => void;
}

export function ReviewListItem({
  review,
  currentUserId,
  highlightedReviewId,
  canWriteComment,
  canToggleLike,
  likingReviewId,
  submittingReviewId,
  onToggleLike,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onRequestLogin,
  onOpenPlace,
  onOpenComments,
}: ReviewListItemProps) {
  return (
    <article
      data-review-id={review.id}
      className={review.id === highlightedReviewId ? 'review-card review-card--feed review-card--highlighted' : 'review-card review-card--feed'}
    >
      <ReviewFeedCardHeader
        title={<strong className="review-card__title">{review.placeName}</strong>}
        mood={review.mood}
        meta={`${review.author} · ${review.visitedAt}`}
      />

      <ReviewTagRow visitLabel={review.visitLabel} badge={review.badge} hasPublishedRoute={review.hasPublishedRoute} />

      {review.imageUrl && (
        <ReviewImageFrame
          src={review.imageUrl}
          thumbnailSrc={review.thumbnailUrl ?? null}
          alt={`${review.placeName} 후기 이미지`}
        />
      )}

      <p className="review-card__body">{review.body}</p>

      <div className="review-card__actions review-card__actions--feed">
        <div className="review-card__action-group review-card__action-group--feed">
          <button
            type="button"
            className={review.likedByMe ? 'review-action-button is-active' : 'review-action-button'}
            disabled={likingReviewId === review.id}
            onClick={() => (canToggleLike ? onToggleLike(review.id) : onRequestLogin())}
            aria-pressed={review.likedByMe}
          >
            <span className="review-action-button__icon" aria-hidden="true">
              <HeartIcon filled={review.likedByMe} />
            </span>
            <span className="review-action-button__label">{review.likeCount}</span>
          </button>
          {onOpenComments ? (
            <button
              type="button"
              className="review-action-button"
              onClick={() => onOpenComments(review.id)}
              aria-label={`댓글 ${review.commentCount}개 보기`}
            >
              <span className="review-action-button__icon" aria-hidden="true">
                <CommentIcon />
              </span>
              <span className="review-action-button__label">{review.commentCount}</span>
            </button>
          ) : (
            <span className="review-action-button review-action-button--static" aria-hidden="true">
              <span className="review-action-button__icon">
                <CommentIcon />
              </span>
              <span className="review-action-button__label">{review.commentCount}</span>
            </span>
          )}
        </div>
        {onOpenPlace && (
          <button type="button" className="review-link-button" onClick={() => onOpenPlace(review.placeId)}>
            장소 보기
          </button>
        )}
      </div>

      {!onOpenComments && (
        <CommentThread
          comments={review.comments}
          canWriteComment={canWriteComment}
          currentUserId={currentUserId}
          submittingReviewId={submittingReviewId}
          mutatingCommentId={null}
          highlightedCommentId={null}
          reviewId={review.id}
          onSubmitComment={onSubmitComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onRequestLogin={onRequestLogin}
        />
      )}
    </article>
  );
}
