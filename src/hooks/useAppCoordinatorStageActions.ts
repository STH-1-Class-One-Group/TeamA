import { useAppPageStageActions } from './useAppPageStageActions';
import { useAppShellNavigation } from './useAppShellNavigation';
import { useAppStageActions } from './useAppStageActions';
import {
  reportCoordinatorBackgroundError,
} from './useAppCoordinatorActionUtils';
import type {
  DataState,
  DomainState,
  RouteState,
} from './useAppShellCoordinator.types';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';

type CoordinatorStageActionsArgs = {
  routeState: RouteState;
  domainState: DomainState;
  dataState: DataState;
  services: ReturnType<typeof useAppCoordinatorServices>;
  refreshCurrentPosition: (shouldFocusMap: boolean) => Promise<void>;
};

export function useAppCoordinatorStageActions({
  routeState,
  domainState,
  dataState,
  services,
  refreshCurrentPosition,
}: CoordinatorStageActionsArgs) {
  const {
    activeTab,
    commitRouteState,
    drawerState,
    goToTab,
    selectedFestivalId,
    selectedPlaceId,
  } = routeState;
  const {
    auth: { sessionUser },
    map: { selectedRoutePreview, setSelectedRoutePreview },
    myPage: { setMyPageTab },
    returnView: { returnView, setReturnView },
    review: {
      activeCommentReviewId,
      setActiveCommentReviewId,
      setFeedPlaceFilterId,
      setHighlightedCommentId,
      setHighlightedReviewId,
    },
  } = domainState;
  const {
    dataLoaders: { fetchCommunityRoutes, refreshMyPageForUser },
    navigationHelpers: {
      handleCloseReviewComments,
      handleOpenCommentWithReturn,
      handleOpenCommunityRouteWithReturn,
      handleOpenPlaceFeedWithReturn,
    },
    viewModels,
  } = services;

  const shellNavigation = useAppShellNavigation({
    sessionUser,
    returnView,
    activeCommentReviewId,
    activeTab,
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    selectedRoutePreview,
    setMyPageTab,
    setActiveCommentReviewId,
    setHighlightedCommentId,
    setHighlightedReviewId,
    setFeedPlaceFilterId,
    setSelectedRoutePreview,
    setReturnView,
    handleCloseReviewComments,
    goToTab,
    commitRouteState,
  });

  const mapStageActions = useAppStageActions({
    selectedPlace: viewModels.selectedPlace,
    selectedFestival: viewModels.selectedFestival,
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    selectedRoutePreview,
    setSelectedRoutePreview,
    commitRouteState,
    goToTab,
    handleOpenPlaceFeedWithReturn,
    refreshCurrentPosition,
  });

  const pageStageActions = useAppPageStageActions({
    sessionUser,
    setFeedPlaceFilterId,
    setCommunityRouteSort: dataState.setCommunityRouteSort,
    handleOpenCommentWithReturn,
    handleOpenCommunityRouteWithReturn,
    fetchCommunityRoutes,
    refreshMyPageForUser,
    reportBackgroundError: reportCoordinatorBackgroundError,
  });

  return {
    shellNavigation,
    mapStageActions,
    pageStageActions,
  };
}
