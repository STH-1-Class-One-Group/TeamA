import { useEffect, useRef } from 'react';
import { getClientConfig } from '../config';
import type { ApiStatus, FestivalItem, Place } from '../types';
import { useNaverMapInstance } from './naver-map/useNaverMapInstance';
import { useNaverMapInteractions } from './naver-map/useNaverMapInteractions';

interface NaverMapProps {
  places: Place[];
  festivals: FestivalItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  onSelectPlace: (placeId: string) => void;
  onSelectFestival: (festivalId: string) => void;
  currentPosition: { latitude: number; longitude: number } | null;
  currentLocationStatus: ApiStatus;
  currentLocationMessage: string | null;
  focusCurrentLocationKey: number;
  onLocateCurrentPosition: () => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onViewportChange?: (lat: number, lng: number, zoom: number) => void;
  routePreviewPlaces?: Place[];
  height?: string;
}

export function NaverMap({
  places,
  festivals,
  selectedPlaceId,
  selectedFestivalId,
  onSelectPlace,
  onSelectFestival,
  currentPosition,
  currentLocationStatus,
  currentLocationMessage,
  focusCurrentLocationKey,
  onLocateCurrentPosition,
  initialCenter,
  initialZoom,
  onViewportChange,
  routePreviewPlaces = [],
  height = '100%',
}: NaverMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const onViewportChangeRef = useRef(onViewportChange);
  const clientId = getClientConfig().naverMapClientId;

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  const { mapRef, status, errorMessage } = useNaverMapInstance({
    clientId,
    mapElementRef,
    initialCenter,
    initialZoom,
    onViewportChangeRef,
  });

  useNaverMapInteractions({
    status,
    mapsApi: window.naver?.maps,
    mapRef,
    mapElementRef,
    places,
    festivals,
    selectedPlaceId,
    selectedFestivalId,
    onSelectPlace,
    onSelectFestival,
    currentPosition,
    focusCurrentLocationKey,
    routePreviewPlaces,
  });

  if (!clientId || status === 'error') {
    return (
      <div className="map-status-card">
        <strong>네이버 지도 연결 대기</strong>
        <p>{errorMessage || '네이버 지도 SDK를 불러오지 못했어요.'}</p>
      </div>
    );
  }

  return (
    <div className="map-surface-frame">
      {status === 'loading' && (
        <div className="map-status-card map-status-card--overlay">
          <strong>대전 지도를 준비하고 있어요</strong>
          <p>잠시만 기다리면 지도와 마커를 바로 보여드릴게요.</p>
        </div>
      )}
      <div className="map-floating-controls">
        <button type="button" className="map-locate-button" onClick={onLocateCurrentPosition} disabled={currentLocationStatus === 'loading'}>
          {currentLocationStatus === 'loading' ? '확인 중' : currentPosition ? '내 위치 보기' : '내 위치 켜기'}
        </button>
      </div>
      <div ref={mapElementRef} style={{ width: '100%', height }} />
      {currentLocationMessage && <div className="map-location-pill">{currentLocationMessage}</div>}
    </div>
  );
}
