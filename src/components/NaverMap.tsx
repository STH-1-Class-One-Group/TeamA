import { useEffect, useRef, useState } from 'react';
import { getClientConfig } from '../config';
import type { ApiStatus, FestivalItem, Place } from '../types';
import {
  currentLocationMarkerContent,
  DAEJEON_CENTER,
  festivalMarkerContent,
  getSelectionVerticalOffset,
  hasFestivalCoordinates,
  loadNaverMaps,
  placeMarkerContent,
  routeStepMarkerContent,
} from './naver-map/naverMapHelpers';

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
  const mapRef = useRef<any>(null);
  const placeMarkersRef = useRef<Map<string, any>>(new Map());
  const festivalMarkersRef = useRef<Map<string, any>>(new Map());
  const currentMarkerRef = useRef<any | null>(null);
  const routeLineRef = useRef<any | null>(null);
  const routeStepMarkersRef = useRef<any[]>([]);
  const onViewportChangeRef = useRef(onViewportChange);
  const idleListenerRef = useRef<any>(null);
  const viewportDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledCurrentLocationFocusKeyRef = useRef(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clientId = getClientConfig().naverMapClientId;

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (!clientId) {
      setStatus('error');
      setErrorMessage('네이버 지도 Client ID가 비어 있어요.');
      return;
    }

    if (!mapElementRef.current) {
      return;
    }

    let isMounted = true;

    loadNaverMaps(clientId)
      .then((maps) => {
        if (!isMounted || !mapElementRef.current || mapRef.current) {
          return;
        }

        mapRef.current = new maps.Map(mapElementRef.current, {
          center: new maps.LatLng(
            initialCenter?.lat ?? DAEJEON_CENTER.latitude,
            initialCenter?.lng ?? DAEJEON_CENTER.longitude,
          ),
          zoom: initialZoom ?? 13,
          minZoom: 11,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: true,
        });

        const idleListener = maps.Event.addListener(mapRef.current, 'idle', () => {
          if (!mapRef.current) {
            return;
          }
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          if (viewportDebounceTimerRef.current !== null) {
            clearTimeout(viewportDebounceTimerRef.current);
          }
          viewportDebounceTimerRef.current = setTimeout(() => {
            onViewportChangeRef.current?.(center.lat(), center.lng(), zoom);
            viewportDebounceTimerRef.current = null;
          }, 300);
        });
        idleListenerRef.current = idleListener;

        setStatus('ready');

        return () => {
          if (viewportDebounceTimerRef.current !== null) {
            clearTimeout(viewportDebounceTimerRef.current);
          }
          maps.Event.removeListener(idleListener);
        };
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }
        setStatus('error');
        setErrorMessage(error.message);
      });

    return () => {
      isMounted = false;
      if (viewportDebounceTimerRef.current !== null) {
        clearTimeout(viewportDebounceTimerRef.current);
        viewportDebounceTimerRef.current = null;
      }
      if (idleListenerRef.current && window.naver?.maps) {
        window.naver.maps.Event.removeListener(idleListenerRef.current);
        idleListenerRef.current = null;
      }
    };
  }, [clientId]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
    const nextIds = new Set(places.map((place) => place.id));

    for (const [placeId, marker] of placeMarkersRef.current.entries()) {
      if (!nextIds.has(placeId)) {
        marker.setMap(null);
        placeMarkersRef.current.delete(placeId);
      }
    }

    places.forEach((place) => {
      const existing = placeMarkersRef.current.get(place.id);
      const position = new maps.LatLng(place.latitude, place.longitude);
      if (existing) {
        existing.setPosition(position);
        return;
      }

      const marker = new maps.Marker({
        map: mapRef.current,
        position,
        title: '',
        icon: {
          content: placeMarkerContent(place, place.id === selectedPlaceId),
          anchor: new maps.Point(15, 15),
        },
      });
      maps.Event.addListener(marker, 'click', () => onSelectPlace(place.id));
      placeMarkersRef.current.set(place.id, marker);
    });
  }, [onSelectPlace, places, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
    places.forEach((place) => {
      const marker = placeMarkersRef.current.get(place.id);
      if (!marker) {
        return;
      }
      marker.setIcon({
        content: placeMarkerContent(place, place.id === selectedPlaceId),
        anchor: new maps.Point(15, 15),
      });
      marker.setZIndex(place.id === selectedPlaceId ? 160 : 100);
    });
  }, [places, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
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
      const position = new maps.LatLng(festival.latitude, festival.longitude);
      if (existing) {
        existing.setPosition(position);
        return;
      }

      const marker = new maps.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex: festival.id === selectedFestivalId ? 170 : 110,
        icon: {
          content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
          anchor: new maps.Point(15, 15),
        },
      });
      maps.Event.addListener(marker, 'click', () => onSelectFestival(festival.id));
      festivalMarkersRef.current.set(festival.id, marker);
    });
  }, [festivals, onSelectFestival, selectedFestivalId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
    festivals.forEach((festival) => {
      const marker = festivalMarkersRef.current.get(festival.id);
      if (!marker) {
        return;
      }
      marker.setIcon({
        content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
        anchor: new maps.Point(15, 15),
      });
      marker.setZIndex(festival.id === selectedFestivalId ? 170 : 110);
    });
  }, [festivals, selectedFestivalId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;

    if (!currentPosition) {
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
        currentMarkerRef.current = null;
      }
      return;
    }

    const position = new maps.LatLng(currentPosition.latitude, currentPosition.longitude);
    if (!currentMarkerRef.current) {
      currentMarkerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex: 200,
        icon: {
          content: currentLocationMarkerContent(),
          anchor: new maps.Point(15, 15),
        },
      });
      return;
    }

    currentMarkerRef.current.setPosition(position);
    currentMarkerRef.current.setMap(mapRef.current);
  }, [currentPosition, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
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
    const targetLatLng = new window.naver.maps.LatLng(target.latitude, target.longitude);
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
          map.panBy(0, -getSelectionVerticalOffset(mapElementRef.current, targetType));
        }
      }, panDelayMs);
    }
  }, [festivals, places, selectedFestivalId, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current || !currentPosition || focusCurrentLocationKey === 0) {
      return;
    }

    if (focusCurrentLocationKey === lastHandledCurrentLocationFocusKeyRef.current) {
      return;
    }

    // A direct place/festival selection is a newer intent than an old
    // "show my location" focus request, so consume and discard it here.
    if (selectedPlaceId || selectedFestivalId) {
      lastHandledCurrentLocationFocusKeyRef.current = focusCurrentLocationKey;
      return;
    }

    lastHandledCurrentLocationFocusKeyRef.current = focusCurrentLocationKey;
    mapRef.current.panTo(new window.naver.maps.LatLng(currentPosition.latitude, currentPosition.longitude));
  }, [currentPosition, focusCurrentLocationKey, selectedFestivalId, selectedPlaceId, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const maps = window.naver.maps;
    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }
    routeStepMarkersRef.current.forEach((marker) => marker.setMap(null));
    routeStepMarkersRef.current = [];

    if (!routePreviewPlaces || routePreviewPlaces.length === 0) {
      return;
    }

    const path = routePreviewPlaces.map((place) => new maps.LatLng(place.latitude, place.longitude));
    routeLineRef.current = new maps.Polyline({
      map: mapRef.current,
      path,
      strokeColor: '#ff6b9d',
      strokeOpacity: 0.82,
      strokeWeight: 4,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      zIndex: 120,
    });

    routeStepMarkersRef.current = routePreviewPlaces.map((place, index) => new maps.Marker({
      map: mapRef.current,
      position: new maps.LatLng(place.latitude, place.longitude),
      title: '',
      zIndex: 165,
      icon: {
        content: routeStepMarkerContent(index + 1),
        anchor: new maps.Point(13, 13),
      },
    }));

    if (routePreviewPlaces.length >= 2 && !selectedPlaceId && !selectedFestivalId) {
      const bounds = new maps.LatLngBounds();
      routePreviewPlaces.forEach((place) => bounds.extend(new maps.LatLng(place.latitude, place.longitude)));
      mapRef.current.fitBounds(bounds, { top: 72, right: 40, bottom: 120, left: 40 });
    } else if (routePreviewPlaces.length === 1 && !selectedPlaceId && !selectedFestivalId) {
      mapRef.current.panTo(new maps.LatLng(routePreviewPlaces[0].latitude, routePreviewPlaces[0].longitude));
    }
  }, [routePreviewPlaces, selectedFestivalId, selectedPlaceId, status]);


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







