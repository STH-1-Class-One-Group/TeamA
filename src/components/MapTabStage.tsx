import { categoryInfo, categoryItems } from '../lib/categories';
import jamissueLogo from '../assets/jamissue-logo.png';
import { FestivalDetailSheet } from './FestivalDetailSheet';
import { NaverMap } from './NaverMap';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import type {
  ApiStatus,
  BootstrapResponse,
  Category,
  DrawerState,
  FestivalItem,
  Place,
  ReviewMood,
  RoutePreview,
  SessionUser,
} from '../types';

interface MapTabStageProps {
  mapData: {
    activeCategory: Category;
    filteredPlaces: Place[];
    festivals: FestivalItem[];
    currentPosition: { latitude: number; longitude: number } | null;
    mapLocationStatus: ApiStatus;
    mapLocationFocusKey: number;
    routePreviewPlaces: Place[];
  };
  routePreviewData: {
    routePreview: RoutePreview | null;
    onClearRoutePreview: () => void;
    onOpenRoutePreviewPlace: (placeId: string) => void;
  };
  viewportData: {
    initialMapCenter?: { lat: number; lng: number };
    initialMapZoom?: number;
    onLocateCurrentPosition: () => void;
    onMapViewportChange: (lat: number, lng: number, zoom: number) => void;
  };
  placeSheet: {
    selectedPlace: Place | null;
    drawerState: DrawerState;
    sessionUser: SessionUser | null;
    selectedPlaceReviews: BootstrapResponse['reviews'];
    visitCount: number;
    latestStamp: BootstrapResponse['stamps']['logs'][number] | null;
    todayStamp: BootstrapResponse['stamps']['logs'][number] | null;
    stampActionStatus: ApiStatus;
    stampActionMessage: string;
    reviewProofMessage: string;
    reviewError: string | null;
    reviewSubmitting: boolean;
    canCreateReview: boolean;
    hasCreatedReviewToday: boolean;
    onOpenPlace: (placeId: string) => void;
    onOpenFeedReview: () => void;
    onCloseDrawer: () => void;
    onExpandPlaceDrawer: () => void;
    onCollapsePlaceDrawer: () => void;
    onRequestLogin: () => void;
    onClaimStamp: (place: Place) => Promise<void>;
    onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
  };
  festivalSheet: {
    selectedFestival: FestivalItem | null;
    drawerState: DrawerState;
    onOpenFestival: (festivalId: string) => void;
    onCloseDrawer: () => void;
    onExpandFestivalDrawer: () => void;
    onCollapseFestivalDrawer: () => void;
  };
  mapActions: {
    setActiveCategory: (category: Category) => void;
  };
}

export function MapTabStage({
  mapData,
  routePreviewData,
  viewportData,
  placeSheet,
  festivalSheet,
  mapActions,
}: MapTabStageProps) {
  return (
    <div className="map-stage">
      <header className="map-stage__header map-stage__header--brand-only">
        <div className="map-stage__brand map-stage__brand--row">
          <div className="map-stage__brand-mark">
            <img src={jamissueLogo} alt="Jam Issue logo" className="map-stage__brand-mark-image" />
          </div>
          <div className="map-stage__brand-copy">
            <p className="map-stage__brand-kicker">DAEJEON LOCAL GUIDE</p>
            <h1 className="map-stage__brand-title">JAM ISSUE</h1>
          </div>
        </div>
      </header>

      <div className="map-filter-strip">
        <div className="chip-row compact-gap">
          {categoryItems.map((item) => {
            const isActive = item.key === mapData.activeCategory;
            const info = item.key === 'all' ? null : categoryInfo[item.key];
            return (
              <button
                key={item.key}
                type="button"
                className={isActive ? 'chip is-active map-filter-chip' : 'chip map-filter-chip'}
                onClick={() => mapActions.setActiveCategory(item.key)}
                style={
                  info
                    ? {
                        background: isActive ? info.color : 'rgba(255,255,255,0.94)',
                        borderColor: info.jamColor,
                        color: '#4a3140',
                      }
                    : undefined
                }
              >
                {info ? String(info.icon) + ' ' + item.label : item.label}
              </button>
            );
          })}
        </div>
      </div>

      <NaverMap
        places={mapData.filteredPlaces}
        festivals={mapData.festivals}
        selectedPlaceId={placeSheet.selectedPlace?.id ?? null}
        selectedFestivalId={festivalSheet.selectedFestival?.id ?? null}
        onSelectPlace={placeSheet.onOpenPlace}
        onSelectFestival={festivalSheet.onOpenFestival}
        currentPosition={mapData.currentPosition}
        currentLocationStatus={mapData.mapLocationStatus}
        currentLocationMessage={null}
        focusCurrentLocationKey={mapData.mapLocationFocusKey}
        onLocateCurrentPosition={viewportData.onLocateCurrentPosition}
        initialCenter={viewportData.initialMapCenter}
        initialZoom={viewportData.initialMapZoom}
        onViewportChange={viewportData.onMapViewportChange}
        routePreviewPlaces={mapData.routePreviewPlaces}
        height="100%"
      />

      {!placeSheet.selectedPlace && !festivalSheet.selectedFestival && routePreviewData.routePreview && (
        <section className="map-route-preview-card">
          <div className="map-route-preview-card__top">
            <div>
              <p className="eyebrow">ROUTE PREVIEW</p>
              <h3>{routePreviewData.routePreview.title}</h3>
              <p className="section-copy">{routePreviewData.routePreview.subtitle}</p>
            </div>
            <button
              type="button"
              className="map-route-preview-card__close"
              onClick={routePreviewData.onClearRoutePreview}
              aria-label="경로 미리보기 닫기"
            >
              <span aria-hidden="true">{'\u00D7'}</span>
            </button>
          </div>
          <div className="course-card__places community-route-places map-route-preview-card__places">
            {routePreviewData.routePreview.placeIds.map((placeId, index) => (
              <button
                key={routePreviewData.routePreview!.id + '-' + placeId}
                type="button"
                className="soft-tag soft-tag--button course-card__place"
                onClick={() => routePreviewData.onOpenRoutePreviewPlace(placeId)}
              >
                {index + 1}. {routePreviewData.routePreview!.placeNames[index] ?? placeId}
              </button>
            ))}
          </div>
        </section>
      )}

      {!placeSheet.selectedPlace && !festivalSheet.selectedFestival && (
        <section className="map-drawer-teaser">
          <span className="map-drawer-teaser__handle" aria-hidden="true" />
          <div className="map-drawer-teaser__peek" aria-hidden="true">
            <div className="map-drawer-teaser__line" />
            <div className="map-drawer-teaser__line map-drawer-teaser__line--short" />
            <div className="map-drawer-teaser__chips">
              <span className="map-drawer-teaser__chip" />
              <span className="map-drawer-teaser__chip" />
              <span className="map-drawer-teaser__chip map-drawer-teaser__chip--wide" />
            </div>
          </div>
        </section>
      )}

      <PlaceDetailSheet
        place={placeSheet.selectedPlace}
        reviews={placeSheet.selectedPlaceReviews}
        isOpen={Boolean(placeSheet.selectedPlace) && placeSheet.drawerState !== 'closed'}
        drawerState={placeSheet.drawerState}
        loggedIn={Boolean(placeSheet.sessionUser)}
        visitCount={placeSheet.visitCount}
        latestStamp={placeSheet.latestStamp}
        todayStamp={placeSheet.todayStamp}
        hasCreatedReviewToday={placeSheet.hasCreatedReviewToday}
        stampActionStatus={placeSheet.stampActionStatus}
        stampActionMessage={placeSheet.stampActionMessage}
        reviewProofMessage={placeSheet.reviewProofMessage}
        reviewError={placeSheet.reviewError}
        reviewSubmitting={placeSheet.reviewSubmitting}
        canCreateReview={placeSheet.canCreateReview}
        onOpenFeedReview={placeSheet.onOpenFeedReview}
        onClose={placeSheet.onCloseDrawer}
        onExpand={placeSheet.onExpandPlaceDrawer}
        onCollapse={placeSheet.onCollapsePlaceDrawer}
        onRequestLogin={placeSheet.onRequestLogin}
        onClaimStamp={placeSheet.onClaimStamp}
        onCreateReview={placeSheet.onCreateReview}
      />

      <FestivalDetailSheet
        festival={festivalSheet.selectedFestival}
        isOpen={Boolean(festivalSheet.selectedFestival) && festivalSheet.drawerState !== 'closed'}
        drawerState={festivalSheet.drawerState}
        onClose={festivalSheet.onCloseDrawer}
        onExpand={festivalSheet.onExpandFestivalDrawer}
        onCollapse={festivalSheet.onCollapseFestivalDrawer}
      />
    </div>
  );
}
