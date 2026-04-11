import { useEffect, useRef, useState } from 'react';
import { loadNaverMaps } from './naverMapHelpers';

type ViewportChangeHandler = ((lat: number, lng: number, zoom: number) => void) | undefined;

type MapInstanceArgs = {
  clientId: string;
  mapElementRef: React.MutableRefObject<HTMLDivElement | null>;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onViewportChangeRef: React.MutableRefObject<ViewportChangeHandler>;
};

export function useNaverMapInstance({
  clientId,
  mapElementRef,
  initialCenter,
  initialZoom,
  onViewportChangeRef,
}: MapInstanceArgs) {
  const mapRef = useRef<any>(null);
  const idleListenerRef = useRef<any>(null);
  const viewportDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          center: new maps.LatLng(initialCenter?.lat ?? 36.3504, initialCenter?.lng ?? 127.3845),
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
  }, [clientId, initialCenter?.lat, initialCenter?.lng, initialZoom, mapElementRef, onViewportChangeRef]);

  return { mapRef, status, errorMessage };
}
