import { FestivalDetailSheet } from './FestivalDetailSheet';
import { NaverMap } from './NaverMap';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { MapStageBrandHeader } from './map-stage/MapStageBrandHeader';
import { MapStageCategoryStrip } from './map-stage/MapStageCategoryStrip';
import { MapStageDrawerTeaser } from './map-stage/MapStageDrawerTeaser';
import { MapStageRoutePreviewCard } from './map-stage/MapStageRoutePreviewCard';
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
  const showRoutePreview = !placeSheet.selectedPlace && !festivalSheet.selectedFestival;

  return (
    <div className="map-stage">
      <MapStageBrandHeader />
      <MapStageCategoryStrip
        activeCategory={mapData.activeCategory}
        onSelectCategory={mapActions.setActiveCategory}
      />

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

      {showRoutePreview && (
        <MapStageRoutePreviewCard
          routePreview={routePreviewData.routePreview}
          onClearRoutePreview={routePreviewData.onClearRoutePreview}
          onOpenRoutePreviewPlace={routePreviewData.onOpenRoutePreviewPlace}
        />
      )}

      {showRoutePreview && <MapStageDrawerTeaser />}

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
