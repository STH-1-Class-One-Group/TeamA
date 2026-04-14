import { useAppAuthActions } from './useAppAuthActions';
import { useAppTabDataLoaders } from './useAppTabDataLoaders';
import { formatCoordinatorErrorMessage } from './useAppCoordinatorActionUtils';
import type { CoordinatorServicesArgs } from './useAppCoordinatorServices.types';

export function useAppCoordinatorAuthLoaders({
  routeState,
  domainState,
  dataState,
}: CoordinatorServicesArgs) {
  const { activeTab } = routeState;
  const {
    auth: { sessionUser },
  } = domainState;
  const {
    adminSummary,
    communityRoutesCacheRef,
    coursesLoadedRef,
    feedLoadedRef,
    myPage,
    replaceCommunityRoutes,
    setAdminLoading,
    setAdminSummary,
    setCommunityRoutes,
    setCourses,
    setMyPage,
    setReviews,
  } = dataState;

  const { startProviderLogin, handleUpdateProfile, handleLogout } = useAppAuthActions({
    setMyPage,
    formatErrorMessage: formatCoordinatorErrorMessage,
  });

  const dataLoaders = useAppTabDataLoaders({
    activeTab,
    adminSummary,
    myPage,
    sessionUser,
    communityRoutesCacheRef,
    feedLoadedRef,
    coursesLoadedRef,
    replaceCommunityRoutes,
    setCommunityRoutes,
    setReviews,
    setCourses,
    setAdminLoading,
    setAdminSummary,
    setMyPage,
  });

  return {
    sessionUser,
    myPage,
    startProviderLogin,
    handleUpdateProfile,
    handleLogout,
    dataLoaders,
  };
}
