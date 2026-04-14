import type { DrawerState, RoutePreview, Tab } from '../../types';

export type RouteState = {
  tab: Tab;
  placeId: string | null;
  festivalId: string | null;
  drawerState: DrawerState;
};

export type AppHistoryState = RouteState & {
  routePreview: RoutePreview | null;
};

export type RouteStateCommitOptions = {
  routePreview?: RoutePreview | null;
};

function isRoutePreview(value: unknown): value is RoutePreview {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<RoutePreview>;
  return typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.subtitle === 'string'
    && typeof candidate.mood === 'string'
    && Array.isArray(candidate.placeIds)
    && Array.isArray(candidate.placeNames);
}

export function getRoutePreviewFromHistoryState(historyState: unknown): RoutePreview | null {
  if (!historyState || typeof historyState !== 'object') {
    return null;
  }

  const routePreview = (historyState as Partial<AppHistoryState>).routePreview;
  return isRoutePreview(routePreview) ? routePreview : null;
}

export function buildHistoryState(routeState: RouteState, routePreview: RoutePreview | null): AppHistoryState {
  return {
    ...routeState,
    routePreview: routePreview ?? null,
  };
}

export function buildRouteUrl(routeState: RouteState) {
  if (typeof window === 'undefined') {
    return '/';
  }

  const params = new URLSearchParams(window.location.search);
  params.set('tab', routeState.tab);

  if (routeState.tab === 'map' && routeState.placeId) {
    params.set('place', routeState.placeId);
    params.delete('festival');
    params.set('drawer', routeState.drawerState === 'closed' ? 'partial' : routeState.drawerState);
  } else if (routeState.tab === 'map' && routeState.festivalId) {
    params.set('festival', routeState.festivalId);
    params.delete('place');
    params.set('drawer', routeState.drawerState === 'closed' ? 'partial' : routeState.drawerState);
  } else {
    params.delete('place');
    params.delete('festival');
    params.delete('drawer');
  }

  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}
