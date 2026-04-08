import { memo } from 'react';
import { MapTabStage } from './MapTabStage';
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

interface AppMapStageViewProps {
  mapData: {
    activeCategory: Category;
    filteredPlaces: Place[];
    festivals: FestivalItem[];
    selectedPlace: Place | null;
    selectedFestival: FestivalItem | null;
    currentPosition: { latitude: number; longitude: number } | null;
    mapLocationStatus: ApiStatus;
    mapLocationFocusKey: number;
    drawerState: DrawerState;
    sessionUser: SessionUser | null;
    selectedPlaceReviews: BootstrapResponse['reviews'];
    routePreview: RoutePreview | null;
    routePreviewPlaces: Place[];
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
    initialMapViewport: { lat: number; lng: number; zoom: number };
  };
  mapActions: {
    setActiveCategory: (category: Category) => void;
    onOpenPlaceFeed: () => void;
    onOpenPlace: (placeId: string) => void;
    onOpenRoutePreviewPlace: (placeId: string) => void;
    onOpenFestival: (festivalId: string) => void;
    onCloseDrawer: () => void;
    onClearRoutePreview: () => void;
    onExpandPlaceDrawer: () => void;
    onCollapsePlaceDrawer: () => void;
    onExpandFestivalDrawer: () => void;
    onCollapseFestivalDrawer: () => void;
    onRequestLogin: () => void;
    onClaimStamp: (place: Place) => Promise<void>;
    onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
    onLocateCurrentPosition: () => void;
    onMapViewportChange: (lat: number, lng: number, zoom: number) => void;
  };
}

export const AppMapStageView = memo(function AppMapStageView({
  mapData,
  mapActions,
}: AppMapStageViewProps) {
  return (
    <MapTabStage
      mapData={{
        activeCategory: mapData.activeCategory,
        filteredPlaces: mapData.filteredPlaces,
        festivals: mapData.festivals,
        currentPosition: mapData.currentPosition,
        mapLocationStatus: mapData.mapLocationStatus,
        mapLocationFocusKey: mapData.mapLocationFocusKey,
        routePreviewPlaces: mapData.routePreviewPlaces,
      }}
      routePreviewData={{
        routePreview: mapData.routePreview,
        onClearRoutePreview: mapActions.onClearRoutePreview,
        onOpenRoutePreviewPlace: mapActions.onOpenRoutePreviewPlace,
      }}
      viewportData={{
        initialMapCenter: { lat: mapData.initialMapViewport.lat, lng: mapData.initialMapViewport.lng },
        initialMapZoom: mapData.initialMapViewport.zoom,
        onLocateCurrentPosition: mapActions.onLocateCurrentPosition,
        onMapViewportChange: mapActions.onMapViewportChange,
      }}
      placeSheet={{
        selectedPlace: mapData.selectedPlace,
        drawerState: mapData.drawerState,
        sessionUser: mapData.sessionUser,
        selectedPlaceReviews: mapData.selectedPlaceReviews,
        visitCount: mapData.visitCount,
        latestStamp: mapData.latestStamp,
        todayStamp: mapData.todayStamp,
        stampActionStatus: mapData.stampActionStatus,
        stampActionMessage: mapData.stampActionMessage,
        reviewProofMessage: mapData.reviewProofMessage,
        reviewError: mapData.reviewError,
        reviewSubmitting: mapData.reviewSubmitting,
        canCreateReview: mapData.canCreateReview,
        hasCreatedReviewToday: mapData.hasCreatedReviewToday,
        onOpenPlace: mapActions.onOpenPlace,
        onOpenFeedReview: mapActions.onOpenPlaceFeed,
        onCloseDrawer: mapActions.onCloseDrawer,
        onExpandPlaceDrawer: mapActions.onExpandPlaceDrawer,
        onCollapsePlaceDrawer: mapActions.onCollapsePlaceDrawer,
        onRequestLogin: mapActions.onRequestLogin,
        onClaimStamp: mapActions.onClaimStamp,
        onCreateReview: mapActions.onCreateReview,
      }}
      festivalSheet={{
        selectedFestival: mapData.selectedFestival,
        drawerState: mapData.drawerState,
        onOpenFestival: mapActions.onOpenFestival,
        onCloseDrawer: mapActions.onCloseDrawer,
        onExpandFestivalDrawer: mapActions.onExpandFestivalDrawer,
        onCollapseFestivalDrawer: mapActions.onCollapseFestivalDrawer,
      }}
      mapActions={{
        setActiveCategory: mapActions.setActiveCategory,
      }}
    />
  );
});
