interface PlaceBadgeRowProps {
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  district: string;
  visitLabel: string;
  visitCount: number;
}

export function PlaceBadgeRow({
  categoryLabel,
  categoryIcon,
  categoryColor,
  district,
  visitLabel,
  visitCount,
}: PlaceBadgeRowProps) {
  return (
    <div className="place-drawer__badges">
      <span className="counter-pill" style={{ background: categoryColor, color: '#4a3140' }}>
        {categoryIcon} {categoryLabel}
      </span>
      <span className="counter-pill">{district}</span>
      <span className="counter-pill">{visitLabel}</span>
      <span className="counter-pill">누적 방문 {visitCount}회</span>
    </div>
  );
}
