interface FeedTabHeaderProps {
  placeFilterName: string | null;
  onClearPlaceFilter: () => void;
}

export function FeedTabHeader({ placeFilterName, onClearPlaceFilter }: FeedTabHeaderProps) {
  return (
    <header className="panel-header">
      <p className="eyebrow">FEED</p>
      <h2>{placeFilterName ? `${placeFilterName} 피드` : '방문 피드'}</h2>
      <p>
        {placeFilterName ? (
          '지도에서 고른 장소의 방문 피드만 먼저 보여줍니다.'
        ) : (
          <>
            스탬프를 찍은 뒤에만 남길 수 있는
            <br />
            실제 방문 후기만 모아 보여줍니다.
          </>
        )}
      </p>
      {placeFilterName && (
        <div className="chip-row compact-gap">
          <span className="soft-tag">{`현재 장소: ${placeFilterName}`}</span>
          <button type="button" className="chip" onClick={onClearPlaceFilter}>
            전체 피드 보기
          </button>
        </div>
      )}
    </header>
  );
}
