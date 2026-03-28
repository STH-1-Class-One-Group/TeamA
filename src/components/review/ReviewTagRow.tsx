interface ReviewTagRowProps {
  visitLabel: string;
  badge: string;
  hasPublishedRoute?: boolean;
}

export function ReviewTagRow({ visitLabel, badge, hasPublishedRoute = false }: ReviewTagRowProps) {
  return (
    <div className="review-card__tag-row">
      <span className="review-card__visit-pill">{visitLabel}</span>
      {hasPublishedRoute ? <span className="soft-tag">연속 여행 기록</span> : null}
      <span className="soft-tag">{badge}</span>
    </div>
  );
}
