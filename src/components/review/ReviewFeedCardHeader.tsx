import type { ReactNode } from 'react';

interface ReviewFeedCardHeaderProps {
  title: ReactNode;
  mood: ReactNode;
  meta: ReactNode;
}

export function ReviewFeedCardHeader({ title, mood, meta }: ReviewFeedCardHeaderProps) {
  return (
    <div className="review-card__top review-card__top--feed">
      <div className="review-card__title-block review-card__title-block--feed">
        <div className="review-card__title-row">
          {title}
          <span className="review-card__mood-inline">{mood}</span>
        </div>
      </div>
      <p className="review-card__corner-meta">{meta}</p>
    </div>
  );
}
