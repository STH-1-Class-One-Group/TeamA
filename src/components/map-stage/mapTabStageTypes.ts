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
} from '../../types';

export interface MapTabStageProps {
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
