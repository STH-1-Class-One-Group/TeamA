import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { FestivalItem } from '../../types';
import { festivalMarkerContent, hasFestivalCoordinates } from './naverMapHelpers';

type MapsApi = typeof window.naver.maps;

type FestivalMarkersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: MapsApi | undefined;
  mapRef: MutableRefObject<any>;
  festivals: FestivalItem[];
  selectedFestivalId: string | null;
  onSelectFestival: (festivalId: string) => void;
};

export function useNaverFestivalMarkers({
  status,
  mapsApi,
  mapRef,
  festivals,
  selectedFestivalId,
  onSelectFestival,
}: FestivalMarkersArgs) {
  const festivalMarkersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const nextIds = new Set(festivals.filter(hasFestivalCoordinates).map((festival) => festival.id));

    for (const [festivalId, marker] of festivalMarkersRef.current.entries()) {
      if (!nextIds.has(festivalId)) {
        marker.setMap(null);
        festivalMarkersRef.current.delete(festivalId);
      }
    }

    festivals.forEach((festival) => {
      if (!hasFestivalCoordinates(festival)) {
        return;
      }
      const existing = festivalMarkersRef.current.get(festival.id);
      const position = new mapsApi.LatLng(festival.latitude, festival.longitude);
      if (existing) {
        existing.setPosition(position);
        return;
      }

      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex: festival.id === selectedFestivalId ? 170 : 110,
        icon: {
          content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
          anchor: new mapsApi.Point(15, 15),
        },
      });
      mapsApi.Event.addListener(marker, 'click', () => onSelectFestival(festival.id));
      festivalMarkersRef.current.set(festival.id, marker);
    });
  }, [festivals, mapRef, mapsApi, onSelectFestival, selectedFestivalId, status]);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    festivals.forEach((festival) => {
      const marker = festivalMarkersRef.current.get(festival.id);
      if (!marker) {
        return;
      }
      marker.setIcon({
        content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
        anchor: new mapsApi.Point(15, 15),
      });
      marker.setZIndex(festival.id === selectedFestivalId ? 170 : 110);
    });
  }, [festivals, mapRef, mapsApi, selectedFestivalId, status]);
}
