import { useActiveReviewComments } from './useActiveReviewComments';
import { useAppPagePaginationActions } from './useAppPagePaginationActions';
import { useAppViewModels } from './useAppViewModels';
import {
  formatCoordinatorErrorMessage,
  reportCoordinatorBackgroundError,
} from './useAppCoordinatorActionUtils';
import type { CoordinatorServicesArgs } from './useAppCoordinatorServices.types';
import type { useAppCoordinatorAuthLoaders } from './useAppCoordinatorAuthLoaders';
import type { useAppCoordinatorNavigationNotifications } from './useAppCoordinatorNavigationNotifications';

type CoordinatorAuthLoaders = ReturnType<typeof useAppCoordinatorAuthLoaders>;
type CoordinatorNavigationNotifications = ReturnType<typeof useAppCoordinatorNavigationNotifications>;

export function useAppCoordinatorViewState(
  { routeState, domainState, shellRuntimeState, dataState }: CoordinatorServicesArgs,
  { sessionUser, myPage }: CoordinatorAuthLoaders,
  { notifications, unreadNotificationCount }: CoordinatorNavigationNotifications,
) {
  const { selectedPlaceId, selectedFestivalId } = routeState;
  const {
    map: { activeCategory, selectedRoutePreview },
    review: { activeCommentReviewId },
  } = domainState;
  const {
    notice,
    setNotice,
    currentPosition,
    mapLocationStatus,
    mapLocationMessage,
    bootstrapStatus,
    bootstrapError,
  } = shellRuntimeState;
  const {
    festivals,
    myPage: myPageData,
    places,
    reviews,
    selectedPlaceReviews,
    setMyPage,
    setReviews,
    stampState,
  } = dataState;

  const viewModels = useAppViewModels({
    places,
    festivals,
    reviews,
    selectedPlaceReviews,
    selectedPlaceId,
    selectedFestivalId,
    selectedRoutePreview,
    activeCategory,
    myPage: myPageData,
    notifications,
    unreadNotificationCount,
    stampState,
    currentPosition,
    sessionUser,
    notice,
    bootstrapStatus,
    bootstrapError,
    mapLocationStatus,
    mapLocationMessage,
  });

  const paginationActions = useAppPagePaginationActions({
    sessionUser,
    myPage,
    setReviews,
    setMyPage,
    reportBackgroundError: reportCoordinatorBackgroundError,
  });

  const activeReviewCommentsState = useActiveReviewComments({
    activeCommentReviewId,
    setNotice,
    formatErrorMessage: formatCoordinatorErrorMessage,
  });

  return {
    viewModels,
    paginationActions,
    activeReviewCommentsState,
  };
}
