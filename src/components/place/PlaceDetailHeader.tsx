interface PlaceDetailHeaderProps {
  name: string;
  summary: string;
  onClose: () => void;
}

export function PlaceDetailHeader({ name, summary, onClose }: PlaceDetailHeaderProps) {
  return (
    <div className="place-drawer__header">
      <div>
        <p className="eyebrow">PLACE</p>
        <h2>{name}</h2>
        <p className="place-drawer__summary">{summary}</p>
      </div>
      <button type="button" className="place-drawer__close" onClick={onClose} aria-label="닫기">
        {'\u00D7'}
      </button>
    </div>
  );
}
