import { useAppMapStore } from '../../store/app-map-store';
import { useAppRouteStore } from '../../store/app-route-store';
import { getInitialRouteState } from './authQueryState';
import { getRoutePreviewFromHistoryState } from './routeHistoryState';

let routeStoreInitialized = false;

export function initializeRouteStore() {
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
