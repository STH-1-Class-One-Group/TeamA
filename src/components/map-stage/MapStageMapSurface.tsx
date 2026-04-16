import { NaverMap } from '../NaverMap';
import { MapStageDrawerTeaser } from './MapStageDrawerTeaser';
import { MapStageRoutePreviewCard } from './MapStageRoutePreviewCard';
import type { MapTabStageProps } from './mapTabStageTypes';

interface MapStageMapSurfaceProps {
  mapData: MapTabStageProps['mapData'];
  routePreviewData: MapTabStageProps['routePreviewData'];
  viewportData: MapTabStageProps['viewportData'];
  placeSheet: MapTabStageProps['placeSheet'];
  festivalSheet: MapTabStageProps['festivalSheet'];
}

export function MapStageMapSurface({
  mapData,
  routePreviewData,
  viewportData,
  placeSheet,
  festivalSheet,
}: MapStageMapSurfaceProps) {
  const showRoutePreview = !placeSheet.selectedPlace && !festivalSheet.selectedFestival;

  return (
    <>
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
    </>
  );
}
