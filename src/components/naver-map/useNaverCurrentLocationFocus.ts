import { useEffect } from 'react';

type NaverMapInstance = {
  panTo?: (position: unknown) => void;
};

type MapsApi = typeof window.naver.maps;

type CurrentLocationFocusArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: MapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  currentPosition: { latitude: number; longitude: number } | null;
  focusCurrentLocationKey: number;
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  lastHandledCurrentLocationFocusKeyRef: React.MutableRefObject<number>;
};

export function useNaverCurrentLocationFocus({
  status,
  mapsApi,
  mapRef,
  currentPosition,
  focusCurrentLocationKey,
  selectedPlaceId,
  selectedFestivalId,
  lastHandledCurrentLocationFocusKeyRef,
}: CurrentLocationFocusArgs) {
  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current || !currentPosition || focusCurrentLocationKey === 0) {
      return;
    }

    if (focusCurrentLocationKey === lastHandledCurrentLocationFocusKeyRef.current) {
      return;
    }

    if (selectedPlaceId || selectedFestivalId) {
      lastHandledCurrentLocationFocusKeyRef.current = focusCurrentLocationKey;
      return;
    }

    lastHandledCurrentLocationFocusKeyRef.current = focusCurrentLocationKey;
    mapRef.current.panTo?.(new mapsApi.LatLng(currentPosition.latitude, currentPosition.longitude));
  }, [
    currentPosition,
    focusCurrentLocationKey,
    lastHandledCurrentLocationFocusKeyRef,
    mapRef,
    mapsApi,
    selectedFestivalId,
    selectedPlaceId,
    status,
  ]);
}
