import { useEffect } from 'react';
import { getInitialNotice } from './useAppRouteState';
import { useAppFeedbackEffects } from './useAppFeedbackEffects';
import { useAppBootstrapLifecycle } from './useAppBootstrapLifecycle';
import type {
  DataState,
  DomainState,
  PageRuntimeState,
  RouteState,
  ShellRuntimeState,
} from './useAppShellCoordinator.types';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';

const STAMP_UNLOCK_RADIUS_METERS = 120;
const NOTICE_DISMISS_DELAY_MS = 4000;

type CoordinatorEffectsArgs = {
  routeState: RouteState;
  domainState: DomainState;
  shellRuntimeState: ShellRuntimeState;
  pageRuntimeState: PageRuntimeState;
  dataState: DataState;
  services: ReturnType<typeof useAppCoordinatorServices>;
};

export function useAppCoordinatorEffects({
  routeState,
  domainState,
  shellRuntimeState,
  pageRuntimeState,
  dataState,
  services,
}: CoordinatorEffectsArgs) {
  const { activeTab, goToTab, selectedPlaceId } = routeState;
  const {
    auth: { sessionUser },
    myPage: { myPageTab },
  } = domainState;
  const { mapLocationMessage, notice, setNotice } = shellRuntimeState;
  const { myCommentsLoadedOnce } = pageRuntimeState;
  const {
    adminSummary,
    communityRouteSort,
    myPage,
    placeReviewsCacheRef,
    resetReviewCaches,
    setFestivals,
    setHasRealData,
    setMyPage,
    setPlaces,
    setSelectedPlaceReviews,
    setStampState,
  } = dataState;
  const {
    dataLoaders: {
      ensureFeedReviews,
      fetchCommunityRoutes,
      refreshAdminSummary,
      refreshMyPageForUser,
    },
    paginationActions: { loadMoreMyComments },
    viewModels,
  } = services;

  useEffect(() => {
    const initialNotice = getInitialNotice();
    if (!initialNotice) {
      return;
    }
    setNotice((current) => current ?? initialNotice);
  }, [setNotice]);

  useAppFeedbackEffects({
    selectedPlace: viewModels.selectedPlace,
    selectedPlaceDistanceMeters: viewModels.selectedPlaceDistanceMeters,
    sessionUser,
    todayStamp: viewModels.todayStamp,
    notice,
    mapLocationMessage,
    stampUnlockRadiusMeters: STAMP_UNLOCK_RADIUS_METERS,
    noticeDismissDelayMs: NOTICE_DISMISS_DELAY_MS,
  });

  useAppBootstrapLifecycle({
    activeTab,
    selectedPlaceId,
    sessionUser,
    myPage,
    myPageTab,
    adminSummary,
    communityRouteSort,
    myCommentsLoadedOnce,
    placeReviewsCacheRef,
    setPlaces,
    setFestivals,
    setStampState,
    setHasRealData,
    setSelectedPlaceReviews,
    setMyPage,
    resetReviewCaches,
    refreshMyPageForUser,
    ensureFeedReviews,
    fetchCommunityRoutes,
    refreshAdminSummary,
    loadMoreMyComments,
    goToTab,
    formatErrorMessage,
    reportBackgroundError,
  });
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '요청을 처리하지 못했어요. 조금 뒤에 다시 시도해 주세요.';
}

function reportBackgroundError(error: unknown) {
  console.error(error);
}
