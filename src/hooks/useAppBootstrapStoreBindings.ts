import { useAuthStore } from '../store/auth-store';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import { useAppRouteStore } from '../store/app-route-store';
import { useAppShellRuntimeStore } from '../store/app-shell-runtime-store';

export function useAppBootstrapStoreBindings() {
  const setSessionUser = useAuthStore((state) => state.setSessionUser);
  const setProviders = useAuthStore((state) => state.setProviders);
  const setBootstrapStatus = useAppShellRuntimeStore((state) => state.setBootstrapStatus);
  const setBootstrapError = useAppShellRuntimeStore((state) => state.setBootstrapError);
  const setSelectedPlaceId = useAppRouteStore((state) => state.setSelectedPlaceId);
  const setSelectedFestivalId = useAppRouteStore((state) => state.setSelectedFestivalId);
  const setNotice = useAppShellRuntimeStore((state) => state.setNotice);
  const setFeedNextCursor = useAppPageRuntimeStore((state) => state.setFeedNextCursor);
  const setFeedHasMore = useAppPageRuntimeStore((state) => state.setFeedHasMore);
  const setFeedLoadingMore = useAppPageRuntimeStore((state) => state.setFeedLoadingMore);
  const setMyCommentsNextCursor = useAppPageRuntimeStore((state) => state.setMyCommentsNextCursor);
  const setMyCommentsHasMore = useAppPageRuntimeStore((state) => state.setMyCommentsHasMore);
  const setMyCommentsLoadingMore = useAppPageRuntimeStore((state) => state.setMyCommentsLoadingMore);
  const setMyCommentsLoadedOnce = useAppPageRuntimeStore((state) => state.setMyCommentsLoadedOnce);

  return {
    setSessionUser,
    setProviders,
    setBootstrapStatus,
    setBootstrapError,
    setSelectedPlaceId,
    setSelectedFestivalId,
    setNotice,
    setFeedNextCursor,
    setFeedHasMore,
    setFeedLoadingMore,
    setMyCommentsNextCursor,
    setMyCommentsHasMore,
    setMyCommentsLoadingMore,
    setMyCommentsLoadedOnce,
  };
}
