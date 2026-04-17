import type * as React from 'react';

import { getMapBootstrap } from '../../api/bootstrapClient';
import type { MyPageResponse, Place, SessionUser, StampState } from '../../types';
import { handleBootstrapAuthNotice } from './bootstrapAuthNotice';
import { applyBootstrapSelections, resetBootstrapRuntime } from './bootstrapRuntimeReset';

type SetProviders = (providers: Array<{ key: 'naver' | 'kakao'; label: string; isEnabled: boolean; loginUrl: string | null }>) => void;

interface BootstrapSharedRefs {
  refreshMyPageForUserRef: { current: (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null> };
  resetReviewCachesRef: { current: () => void };
  goToTabRef: { current: (tab: 'my', historyMode?: 'push' | 'replace') => void };
}

interface BootstrapMapSessionParams extends BootstrapSharedRefs {
  authState: string | null;
  setPlaces: React.Dispatch<React.SetStateAction<Place[]>>;
  setStampState: React.Dispatch<React.SetStateAction<StampState>>;
  setHasRealData: React.Dispatch<React.SetStateAction<boolean>>;
  setSessionUser: (user: SessionUser | null) => void;
  setFeedNextCursor: (cursor: string | null) => void;
  setFeedHasMore: (value: boolean) => void;
  setFeedLoadingMore: (value: boolean) => void;
  setMyCommentsNextCursor: (cursor: string | null) => void;
  setMyCommentsHasMore: (value: boolean) => void;
  setMyCommentsLoadingMore: (value: boolean) => void;
  setMyCommentsLoadedOnce: (value: boolean) => void;
  setProviders: SetProviders;
  setSelectedPlaceId: (updater: (current: string | null) => string | null) => void;
  setSelectedFestivalId: (updater: (current: string | null) => string | null) => void;
  setMyPage: React.Dispatch<React.SetStateAction<MyPageResponse | null>>;
  setNotice: (message: string | null) => void;
  isActive: () => boolean;
}

export async function bootstrapMapSession({
  authState,
  refreshMyPageForUserRef,
  resetReviewCachesRef,
  goToTabRef,
  setPlaces,
  setStampState,
  setHasRealData,
  setSessionUser,
  setFeedNextCursor,
  setFeedHasMore,
  setFeedLoadingMore,
  setMyCommentsNextCursor,
  setMyCommentsHasMore,
  setMyCommentsLoadingMore,
  setMyCommentsLoadedOnce,
  setProviders,
  setSelectedPlaceId,
  setSelectedFestivalId,
  setMyPage,
  setNotice,
  isActive,
}: BootstrapMapSessionParams) {
  const bootstrap = await getMapBootstrap();
  if (!isActive()) {
    return;
  }

  setPlaces(bootstrap.places);
  setStampState(bootstrap.stamps);
  setHasRealData(bootstrap.hasRealData);
  setSessionUser(bootstrap.auth.user);
  resetReviewCachesRef.current();
  resetBootstrapRuntime({
    setFeedNextCursor,
    setFeedHasMore,
    setFeedLoadingMore,
    setMyCommentsNextCursor,
    setMyCommentsHasMore,
    setMyCommentsLoadingMore,
    setMyCommentsLoadedOnce,
    setProviders,
  });
  setProviders(bootstrap.auth.providers);
  applyBootstrapSelections({
    placeIds: bootstrap.places.map((place) => place.id),
    setSelectedPlaceId,
    setSelectedFestivalId,
  });

  if (bootstrap.auth.user) {
    await refreshMyPageForUserRef.current(bootstrap.auth.user, true);
    if (!isActive()) {
      return;
    }
  } else {
    setMyPage(null);
  }

  handleBootstrapAuthNotice({
    authState,
    user: bootstrap.auth.user,
    goToTab: goToTabRef.current,
    setNotice,
  });
}
