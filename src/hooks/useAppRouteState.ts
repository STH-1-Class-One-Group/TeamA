import { useCallback, useEffect } from 'react';
import { useAppMapStore } from '../store/app-map-store';
import { useAppRouteStore } from '../store/app-route-store';
import type { RoutePreview, Tab } from '../types';
import {
  clearAuthQueryParams,
  getInitialNotice,
  getInitialRouteState,
  getLoginReturnUrl,
} from './app-route/authQueryState';
import {
  getInitialMapViewport,
  updateMapViewportInUrl,
  type MapViewport,
} from './app-route/mapViewportState';
import {
  buildHistoryState,
  buildRouteUrl,
  getRoutePreviewFromHistoryState,
  type AppHistoryState,
  type RouteState,
  type RouteStateCommitOptions,
} from './app-route/routeHistoryState';

export {
  clearAuthQueryParams,
  getInitialMapViewport,
  getInitialNotice,
  getInitialRouteState,
  getLoginReturnUrl,
  updateMapViewportInUrl,
};
export type { AppHistoryState, MapViewport, RouteState, RouteStateCommitOptions };
export { buildHistoryState, buildRouteUrl, getRoutePreviewFromHistoryState };

let routeStoreInitialized = false;

function initializeRouteStore() {
  if (routeStoreInitialized || typeof window === 'undefined') {
    return;
  }

  const routeState = getInitialRouteState();
  useAppRouteStore.setState({
    activeTab: routeState.tab,
    selectedPlaceId: routeState.tab === 'map' ? routeState.placeId : null,
    selectedFestivalId: routeState.tab === 'map' ? routeState.festivalId : null,
    drawerState: routeState.tab === 'map' ? routeState.drawerState : 'closed',
  });
  useAppMapStore.setState({ selectedRoutePreview: getRoutePreviewFromHistoryState(window.history.state) });
  routeStoreInitialized = true;
}

export function useAppRouteState() {
  initializeRouteStore();

  const activeTab = useAppRouteStore((state) => state.activeTab);
  const drawerState = useAppRouteStore((state) => state.drawerState);
  const selectedPlaceId = useAppRouteStore((state) => state.selectedPlaceId);
  const selectedFestivalId = useAppRouteStore((state) => state.selectedFestivalId);
  const setActiveTab = useAppRouteStore((state) => state.setActiveTab);
  const setDrawerState = useAppRouteStore((state) => state.setDrawerState);
  const setSelectedPlaceId = useAppRouteStore((state) => state.setSelectedPlaceId);
  const setSelectedFestivalId = useAppRouteStore((state) => state.setSelectedFestivalId);
  const selectedRoutePreview = useAppMapStore((state) => state.selectedRoutePreview);
  const setSelectedRoutePreview = useAppMapStore((state) => state.setSelectedRoutePreview);

  const applyRouteState = useCallback((routeState: RouteState, routePreview: RoutePreview | null = null) => {
    setActiveTab(routeState.tab);
    setSelectedPlaceId(routeState.tab === 'map' ? routeState.placeId : null);
    setSelectedFestivalId(routeState.tab === 'map' ? routeState.festivalId : null);
    setDrawerState(routeState.tab === 'map' ? routeState.drawerState : 'closed');
    setSelectedRoutePreview(routeState.tab === 'map' ? routePreview : null);
  }, [setActiveTab, setDrawerState, setSelectedFestivalId, setSelectedPlaceId, setSelectedRoutePreview]);

  const commitRouteState = useCallback(
    (routeState: RouteState, mode: 'push' | 'replace' = 'push', options?: RouteStateCommitOptions) => {
      const requestedRoutePreview = options && Object.prototype.hasOwnProperty.call(options, 'routePreview')
        ? options.routePreview ?? null
        : selectedRoutePreview;
      const nextRoutePreview = routeState.tab === 'map' ? requestedRoutePreview : null;
      applyRouteState(routeState, nextRoutePreview);
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
    },
    [applyRouteState, selectedRoutePreview],
  );

  const goToTab = useCallback(
    (nextTab: Tab, mode: 'push' | 'replace' = 'push') => {
      commitRouteState(
        {
          tab: nextTab,
          placeId: null,
          festivalId: null,
          drawerState: 'closed',
        },
        mode,
        { routePreview: null },
      );
    },
    [commitRouteState],
  );

  const openPlace = useCallback(
    (placeId: string) => {
      commitRouteState({
        tab: 'map',
        placeId,
        festivalId: null,
        drawerState: 'partial',
      });
    },
    [commitRouteState],
  );

  const openFestival = useCallback(
    (festivalId: string) => {
      commitRouteState({
        tab: 'map',
        placeId: null,
        festivalId,
        drawerState: 'partial',
      });
    },
    [commitRouteState],
  );

  const closeDrawer = useCallback(() => {
    commitRouteState({
      tab: 'map',
      placeId: null,
      festivalId: null,
      drawerState: 'closed',
    });
  }, [commitRouteState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = (event: PopStateEvent) => {
      applyRouteState(getInitialRouteState(), getRoutePreviewFromHistoryState(event.state));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyRouteState]);

  return {
    activeTab,
    drawerState,
    selectedPlaceId,
    selectedFestivalId,
    setSelectedPlaceId,
    setSelectedFestivalId,
    commitRouteState,
    goToTab,
    openPlace,
    openFestival,
    closeDrawer,
  };
}
