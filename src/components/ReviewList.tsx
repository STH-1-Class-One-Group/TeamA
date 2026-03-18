import { CommentThread } from './CommentThread';
import type { Review } from '../types';

interface ReviewListProps {
  reviews: Review[];
  canWriteComment: boolean;
  canToggleLike: boolean;
  likingReviewId: string | null;
  submittingReviewId: string | null;
  onToggleLike: (reviewId: string) => Promise<void>;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onRequestLogin: () => void;
  onOpenPlace?: (placeId: string) => void;
  emptyTitle: string;
  emptyBody: string;
}

export function ReviewList({
  reviews,
  canWriteComment,
  canToggleLike,
  likingReviewId,
  submittingReviewId,
  onToggleLike,
  onSubmitComment,
  onRequestLogin,
  onOpenPlace,
  emptyTitle,
  emptyBody,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <section className="sheet-card stack-gap">
        <strong>{emptyTitle}</strong>
        <p className="section-copy">{emptyBody}</p>
      </section>
    );
  }

  return (
    <div className="review-stack">
      {reviews.map((review) => (
        <article key={review.id} className="review-card">
          <div className="review-card__top">
            <div className="review-card__heading">
              <strong>{review.placeName}</strong>
              <p className="review-card__author-line">
                {review.author} · {review.visitLabel} · {review.visitedAt}
              </p>
            </div>
            <span className="mood-pill">{review.mood}</span>
          </div>

          <div className="review-card__meta-line">
            <span className="review-card__visit-pill">{review.visitLabel}</span>
            {review.travelSessionId && <span className="soft-tag">연속 여행 기록</span>}
            <span className="soft-tag">{review.badge}</span>
          </div>

          <p className="review-card__body">{review.body}</p>

          {review.imageUrl && <img className="review-card__image" src={review.imageUrl} alt={`${review.placeName} 후기 이미지`} />}

          <div className="review-card__actions">
            <div className="review-card__action-group">
              <button
                type="button"
                className={review.likedByMe ? 'review-action-button is-active' : 'review-action-button'}
                disabled={likingReviewId === review.id}
                onClick={() => (canToggleLike ? onToggleLike(review.id) : onRequestLogin())}
                aria-pressed={review.likedByMe}
              >
                <span className="review-action-button__icon" aria-hidden="true">
                  {review.likedByMe ? '♥' : '♡'}
                </span>
                <span className="review-action-button__label">{likingReviewId === review.id ? '반영 중' : review.likeCount}</span>
              </button>
              <span className="review-action-button review-action-button--static" aria-hidden="true">
                <span className="review-action-button__icon">💬</span>
                <span className="review-action-button__label">{review.comments.length}</span>
              </span>
            </div>
            {onOpenPlace && (
              <button type="button" className="review-link-button" onClick={() => onOpenPlace(review.placeId)}>
                장소 보기
              </button>
            )}
          </div>

          <CommentThread
            comments={review.comments}
            canWriteComment={canWriteComment}
            submittingReviewId={submittingReviewId}
            reviewId={review.id}
            onSubmitComment={onSubmitComment}
            onRequestLogin={onRequestLogin}
          />
        </article>
      ))}
    </div>
  );
}


