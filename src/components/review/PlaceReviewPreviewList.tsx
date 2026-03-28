import { formatReviewVisitedAt } from '../../lib/visits';
import type { Review } from '../../types';

interface PlaceReviewPreviewListProps {
  reviews: Review[];
}

export function PlaceReviewPreviewList({ reviews }: PlaceReviewPreviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="sheet-card stack-gap place-drawer__preview-empty">
        <strong>아직 등록된 피드가 없어요.</strong>
        <p className="section-copy">오늘 방문 인증을 마친 뒤 첫 피드를 남겨 보세요.</p>
      </div>
    );
  }

  return (
    <div className="review-stack place-drawer__feed-preview">
      {reviews.map((review) => (
        <article key={review.id} className="sheet-card place-drawer__preview-card">
          <div className="review-card__top place-drawer__preview-top">
            <strong>{review.author}</strong>
            <span className="counter-pill counter-pill--muted">{review.badge}</span>
          </div>
          <p className="review-card__meta-line">
            {review.visitLabel} / {formatReviewVisitedAt(review.visitedAt)}
          </p>
          <p className="review-card__body place-drawer__preview-body">{review.body}</p>
        </article>
      ))}
    </div>
  );
}
