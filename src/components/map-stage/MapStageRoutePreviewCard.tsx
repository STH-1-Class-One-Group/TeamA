import type { RoutePreview } from '../../types';

type MapStageRoutePreviewCardProps = {
  routePreview: RoutePreview | null;
  onClearRoutePreview: () => void;
  onOpenRoutePreviewPlace: (placeId: string) => void;
};

export function MapStageRoutePreviewCard({
  routePreview,
  onClearRoutePreview,
  onOpenRoutePreviewPlace,
}: MapStageRoutePreviewCardProps) {
  if (!routePreview) {
    return null;
  }

  return (
    <section className="map-route-preview-card">
      <div className="map-route-preview-card__top">
        <div>
          <p className="eyebrow">ROUTE PREVIEW</p>
          <h3>{routePreview.title}</h3>
          <p className="section-copy">{routePreview.subtitle}</p>
        </div>
        <button
          type="button"
          className="map-route-preview-card__close"
          onClick={onClearRoutePreview}
          aria-label="경로 미리보기 닫기"
        >
          <span aria-hidden="true">{'\u00D7'}</span>
        </button>
      </div>
      <div className="course-card__places community-route-places map-route-preview-card__places">
        {routePreview.placeIds.map((placeId, index) => (
          <button
            key={routePreview.id + '-' + placeId}
            type="button"
            className="soft-tag soft-tag--button course-card__place"
            onClick={() => onOpenRoutePreviewPlace(placeId)}
          >
            {index + 1}. {routePreview.placeNames[index] ?? placeId}
          </button>
        ))}
      </div>
    </section>
  );
}
