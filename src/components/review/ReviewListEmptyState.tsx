interface ReviewListEmptyStateProps {
  emptyTitle: string;
  emptyBody: string;
}

export function ReviewListEmptyState({ emptyTitle, emptyBody }: ReviewListEmptyStateProps) {
  return (
    <section className="sheet-card stack-gap">
      <strong>{emptyTitle}</strong>
      <p className="section-copy">{emptyBody}</p>
    </section>
  );
}
