import type { RoutePreview, Tab } from '../../types';
import type { RouteState, RouteStateCommitOptions } from './routeHistoryState';
import { buildHistoryState, buildRouteUrl } from './routeHistoryState';

interface RouteStateSetterSet {
  setActiveTab: (tab: Tab) => void;
  setSelectedPlaceId: (placeId: string | null) => void;
  setSelectedFestivalId: (festivalId: string | null) => void;
  setDrawerState: (state: 'closed' | 'partial' | 'full') => void;
  setSelectedRoutePreview: (preview: RoutePreview | null) => void;
}

export function applyRouteState(
  routeState: RouteState,
  routePreview: RoutePreview | null,
  setters: RouteStateSetterSet,
) {
  setters.setActiveTab(routeState.tab);
  setters.setSelectedPlaceId(routeState.tab === 'map' ? routeState.placeId : null);
  setters.setSelectedFestivalId(routeState.tab === 'map' ? routeState.festivalId : null);
  setters.setDrawerState(routeState.tab === 'map' ? routeState.drawerState : 'closed');
  setters.setSelectedRoutePreview(routeState.tab === 'map' ? routePreview : null);
}

interface BuildCommitRouteStateParams extends RouteStateSetterSet {
  getSelectedRoutePreview: () => RoutePreview | null;
}

export function buildCommitRouteState({
  getSelectedRoutePreview,
  ...setters
}: BuildCommitRouteStateParams) {
  return (routeState: RouteState, mode: 'push' | 'replace' = 'push', options?: RouteStateCommitOptions) => {
    const requestedRoutePreview = options && Object.prototype.hasOwnProperty.call(options, 'routePreview')
      ? options.routePreview ?? null
      : getSelectedRoutePreview();
    const nextRoutePreview = routeState.tab === 'map' ? requestedRoutePreview : null;
    applyRouteState(routeState, nextRoutePreview, setters);

    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = buildRouteUrl(routeState);
    const nextHistoryState = buildHistoryState(routeState, nextRoutePreview);
    if (mode === 'replace') {
      window.history.replaceState(nextHistoryState, '', nextUrl);
      return;
    }

    window.history.pushState(nextHistoryState, '', nextUrl);
  };
}
