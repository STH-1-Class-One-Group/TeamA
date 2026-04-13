import { useAppAdminActions } from './useAppAdminActions';
import { useAppMapActions } from './useAppMapActions';
import { useAppReviewActions } from './useAppReviewActions';
import { useAppRouteActions } from './useAppRouteActions';
import { formatCoordinatorErrorMessage } from './useAppCoordinatorActionUtils';
import type {
  DataState,
  DomainState,
  RouteState,
  ShellRuntimeState,
} from './useAppShellCoordinator.types';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';

type CoordinatorMutationActionsArgs = {
  routeState: RouteState;
  domainState: DomainState;
  shellRuntimeState: ShellRuntimeState;
  dataState: DataState;
  services: ReturnType<typeof useAppCoordinatorServices>;
};

export function useAppCoordinatorMutationActions({
  routeState,
  domainState,
  shellRuntimeState,
  dataState,
  services,
}: CoordinatorMutationActionsArgs) {
  const {
    activeTab,
    commitRouteState,
    goToTab,
  } = routeState;
  const {
    auth: { sessionUser },
    review: {
      activeCommentReviewId,
      highlightedReviewId,
    },
  } = domainState;
  const { setNotice } = shellRuntimeState;
  const {
    communityRoutesCacheRef,
    patchCommunityRoutes,
    patchReviewCollections,
    placeReviewsCacheRef,
    myPage,
    reviews,
    selectedPlaceReviews,
    setAdminBusyPlaceId,
    setAdminLoading,
    setAdminSummary,
    setFestivals,
    setHasRealData,
    setMyPage,
    setPlaces,
    setReviews,
    setSelectedPlaceReviews,
    setStampState,
    upsertReviewCollections,
  } = dataState;
  const {
    activeReviewCommentsState,
    dataLoaders: { refreshAdminSummary, refreshMyPageForUser },
    navigationHelpers: { handleCloseReviewComments },
    viewModels,
  } = services;

  const { refreshCurrentPosition, handleClaimStamp } = useAppMapActions({
    sessionUser,
    setPlaces,
    setStampState,
    goToTab,
    commitRouteState,
    refreshMyPageForUser,
    formatErrorMessage: formatCoordinatorErrorMessage,
  });

  const reviewActions = useAppReviewActions({
    activeTab,
    sessionUser,
    selectedPlace: viewModels.selectedPlace,
    reviews,
    selectedPlaceReviews,
    myPage,
    activeCommentReviewId,
    highlightedReviewId,
    setSelectedPlaceReviews,
    setReviews,
    setMyPage,
    setNotice,
    goToTab,
    commitRouteState,
    refreshMyPageForUser,
    patchReviewCollections,
    upsertReviewCollections,
    placeReviewsCacheRef,
    handleCloseReviewComments,
    syncReviewComments: activeReviewCommentsState.syncReviewComments,
    clearReviewComments: activeReviewCommentsState.clearReviewComments,
    formatErrorMessage: formatCoordinatorErrorMessage,
  });

  const routeActions = useAppRouteActions({
    setMyPage,
    communityRoutesCacheRef,
    patchCommunityRoutes,
    refreshMyPageForUser,
    formatErrorMessage: formatCoordinatorErrorMessage,
    goToTab,
  });

  const adminActions = useAppAdminActions({
    sessionUser,
    setAdminBusyPlaceId,
    setAdminSummary,
    setPlaces,
    setStampState,
    setHasRealData,
    setAdminLoading,
    setFestivals,
    refreshAdminSummary,
    formatErrorMessage: formatCoordinatorErrorMessage,
  });

  return {
    refreshCurrentPosition,
    handleClaimStamp,
    reviewActions,
    routeActions,
    adminActions,
  };
}
