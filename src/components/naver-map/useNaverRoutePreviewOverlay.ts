import { useEffect } from 'react';
import type { Place } from '../../types';
import { routeStepMarkerContent } from './naverMapHelpers';

type NaverMapInstance = {
  fitBounds?: (bounds: unknown, padding?: Record<string, number>) => void;
  panTo?: (position: unknown) => void;
};

type MarkerInstance = {
  setMap: (map: unknown) => void;
};

type PolylineInstance = {
  setMap: (map: unknown) => void;
};

type MapsApi = typeof window.naver.maps;

type RoutePreviewOverlayArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: MapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  routeLineRef: React.MutableRefObject<PolylineInstance | null>;
  routeStepMarkersRef: React.MutableRefObject<MarkerInstance[]>;
  routePreviewPlaces: Place[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
};

export function useNaverRoutePreviewOverlay({
  status,
  mapsApi,
  mapRef,
  routeLineRef,
  routeStepMarkersRef,
  routePreviewPlaces,
  selectedPlaceId,
  selectedFestivalId,
}: RoutePreviewOverlayArgs) {
  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }
    routeStepMarkersRef.current.forEach((marker) => marker.setMap(null));
    routeStepMarkersRef.current = [];

    if (!routePreviewPlaces || routePreviewPlaces.length === 0) {
      return;
    }

    const path = routePreviewPlaces.map((place) => new mapsApi.LatLng(place.latitude, place.longitude));
    routeLineRef.current = new mapsApi.Polyline({
      map: mapRef.current,
      path,
      strokeColor: '#ff6b9d',
      strokeOpacity: 0.82,
      strokeWeight: 4,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      zIndex: 120,
    });

    routeStepMarkersRef.current = routePreviewPlaces.map(
      (place, index) =>
        new mapsApi.Marker({
          map: mapRef.current,
          position: new mapsApi.LatLng(place.latitude, place.longitude),
          title: '',
          zIndex: 165,
          icon: {
            content: routeStepMarkerContent(index + 1),
            anchor: new mapsApi.Point(13, 13),
          },
        }),
    );

    if (routePreviewPlaces.length >= 2 && !selectedPlaceId && !selectedFestivalId) {
      const bounds = new mapsApi.LatLngBounds();
      routePreviewPlaces.forEach((place) => bounds.extend(new mapsApi.LatLng(place.latitude, place.longitude)));
      mapRef.current.fitBounds?.(bounds, { top: 72, right: 40, bottom: 120, left: 40 });
    } else if (routePreviewPlaces.length === 1 && !selectedPlaceId && !selectedFestivalId) {
      mapRef.current.panTo?.(new mapsApi.LatLng(routePreviewPlaces[0].latitude, routePreviewPlaces[0].longitude));
    }
  }, [
    mapRef,
    mapsApi,
    routeLineRef,
    routePreviewPlaces,
    routeStepMarkersRef,
    selectedFestivalId,
    selectedPlaceId,
    status,
  ]);
}
