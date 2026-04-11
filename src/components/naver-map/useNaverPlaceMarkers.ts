import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Place } from '../../types';
import { placeMarkerContent } from './naverMapHelpers';

type MapsApi = typeof window.naver.maps;

type PlaceMarkersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: MapsApi | undefined;
  mapRef: MutableRefObject<any>;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

export function useNaverPlaceMarkers({
  status,
  mapsApi,
  mapRef,
  places,
  selectedPlaceId,
  onSelectPlace,
}: PlaceMarkersArgs) {
  const placeMarkersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const nextIds = new Set(places.map((place) => place.id));

    for (const [placeId, marker] of placeMarkersRef.current.entries()) {
      if (!nextIds.has(placeId)) {
        marker.setMap(null);
        placeMarkersRef.current.delete(placeId);
      }
    }

    places.forEach((place) => {
      const existing = placeMarkersRef.current.get(place.id);
      const position = new mapsApi.LatLng(place.latitude, place.longitude);
      if (existing) {
        existing.setPosition(position);
        return;
      }

      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        icon: {
          content: placeMarkerContent(place, place.id === selectedPlaceId),
          anchor: new mapsApi.Point(15, 15),
        },
      });
      mapsApi.Event.addListener(marker, 'click', () => onSelectPlace(place.id));
      placeMarkersRef.current.set(place.id, marker);
    });
  }, [mapRef, mapsApi, onSelectPlace, places, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    places.forEach((place) => {
      const marker = placeMarkersRef.current.get(place.id);
      if (!marker) {
        return;
      }
      marker.setIcon({
        content: placeMarkerContent(place, place.id === selectedPlaceId),
        anchor: new mapsApi.Point(15, 15),
      });
      marker.setZIndex(place.id === selectedPlaceId ? 160 : 100);
    });
  }, [mapRef, mapsApi, places, selectedPlaceId, status]);
}
