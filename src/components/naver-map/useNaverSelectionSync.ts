import { useEffect } from 'react';
import type { FestivalItem, Place } from '../../types';
import { hasFestivalCoordinates } from './markerContent';
import { getSelectionVerticalOffset } from './selectionOffset';

type NaverMapInstance = {
  getZoom?: () => number;
  setZoom?: (zoom: number, effect?: boolean) => void;
  panTo?: (position: unknown) => void;
  setCenter?: (position: unknown) => void;
  panBy?: (x: number, y: number) => void;
};

type MapsApi = typeof window.naver.maps;

type SelectionSyncArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: MapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  mapElementRef: React.MutableRefObject<HTMLDivElement | null>;
  places: Place[];
  festivals: FestivalItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
};

export function useNaverSelectionSync({
  status,
  mapsApi,
  mapRef,
  mapElementRef,
  places,
  festivals,
  selectedPlaceId,
  selectedFestivalId,
}: SelectionSyncArgs) {
  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const selectedPlace = selectedPlaceId ? places.find((place) => place.id === selectedPlaceId) : null;
    const selectedFestival = selectedFestivalId ? festivals.find((festival) => festival.id === selectedFestivalId) : null;
    const targetType = selectedPlace ? 'place' : selectedFestival ? 'festival' : null;
    const target = selectedPlace
      ? { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }
      : selectedFestival && hasFestivalCoordinates(selectedFestival)
        ? { latitude: selectedFestival.latitude, longitude: selectedFestival.longitude }
        : null;

    if (!target || !targetType) {
      return;
    }

    const map = mapRef.current;
    const targetLatLng = new mapsApi.LatLng(target.latitude, target.longitude);
    const currentZoom = typeof map.getZoom === 'function' ? Number(map.getZoom()) : 13;
    const nextZoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 15) : 15;

    if (typeof map.setZoom === 'function' && currentZoom < nextZoom) {
      map.setZoom(nextZoom, false);
    }

    if (typeof map.panTo === 'function') {
      map.panTo(targetLatLng);
    } else if (typeof map.setCenter === 'function') {
      map.setCenter(targetLatLng);
    }

    if (typeof map.panBy === 'function') {
      const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 640;
      const panDelayMs = isMobileViewport && targetType === 'place' ? 260 : 180;
      window.setTimeout(() => {
        if (mapRef.current === map) {
          map.panBy?.(0, -getSelectionVerticalOffset(mapElementRef.current, targetType));
        }
      }, panDelayMs);
    }
  }, [festivals, mapElementRef, mapRef, mapsApi, places, selectedFestivalId, selectedPlaceId, status]);
}
