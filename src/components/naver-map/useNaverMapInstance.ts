import { useEffect, useRef, useState } from 'react';
import { DAEJEON_CENTER, loadNaverMaps } from './mapSdk';

type MapInstanceArgs = {
  clientId: string;
  mapElementRef: React.MutableRefObject<HTMLDivElement | null>;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
};

export function useNaverMapInstance({
  clientId,
  mapElementRef,
  initialCenter,
  initialZoom,
}: MapInstanceArgs) {
  const mapRef = useRef<any>(null);
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
          center: new maps.LatLng(initialCenter?.lat ?? DAEJEON_CENTER.latitude, initialCenter?.lng ?? DAEJEON_CENTER.longitude),
          zoom: initialZoom ?? 13,
          minZoom: 11,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: true,
        });

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
    };
  }, [clientId, initialCenter?.lat, initialCenter?.lng, initialZoom, mapElementRef]);

  return { mapRef, status, errorMessage };
}
