import { useEffect, useRef } from 'react';

export function useHighlightedCourseRoute(highlightedRouteId: string | null) {
  const routeRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!highlightedRouteId) {
      return;
    }
    const target = routeRefs.current[highlightedRouteId];
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedRouteId]);

  return routeRefs;
}
