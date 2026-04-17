import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type {
  FestivalItem,
  MyPageResponse,
  Place,
  SessionUser,
  StampState,
} from '../types';
import { bootstrapFestivalLoader } from './app-bootstrap/bootstrapFestivalLoader';
import { bootstrapMapSession } from './app-bootstrap/bootstrapMapSession';
import { clearAuthQueryParams } from './useAppRouteState';
import type { AppBootstrapSharedRefs } from './useAppBootstrapSharedRefs';

type SetProviders = (providers: Array<{ key: 'naver' | 'kakao'; label: string; isEnabled: boolean; loginUrl: string | null }>) => void;

interface UseMapBootstrapEffectParams extends AppBootstrapSharedRefs {
  setBootstrapStatus: (status: 'idle' | 'loading' | 'ready' | 'error') => void;
  setBootstrapError: (message: string | null) => void;
  setPlaces: Dispatch<SetStateAction<Place[]>>;
  setStampState: Dispatch<SetStateAction<StampState>>;
  setHasRealData: Dispatch<SetStateAction<boolean>>;
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
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  setNotice: (message: string | null) => void;
}

export function useMapBootstrapEffect({
  refreshMyPageForUserRef,
  resetReviewCachesRef,
  goToTabRef,
  formatErrorMessageRef,
  setBootstrapStatus,
  setBootstrapError,
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
}: UseMapBootstrapEffectParams) {
  useEffect(() => {
    let active = true;

    void (async () => {
      const authParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
      const authState = authParams?.get('auth') ?? null;

      setBootstrapStatus('loading');
      setBootstrapError(null);

      try {
        await bootstrapMapSession({
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
          isActive: () => active,
        });
        if (!active) {
          return;
        }

        setBootstrapStatus('ready');
      } catch (error) {
        setBootstrapError(formatErrorMessageRef.current(error));
        setBootstrapStatus('error');
      } finally {
        clearAuthQueryParams();
      }
    })();

    return () => {
      active = false;
    };
  }, [
    formatErrorMessageRef,
    goToTabRef,
    refreshMyPageForUserRef,
    resetReviewCachesRef,
    setBootstrapError,
    setBootstrapStatus,
    setFeedHasMore,
    setFeedLoadingMore,
    setFeedNextCursor,
    setHasRealData,
    setMyCommentsHasMore,
    setMyCommentsLoadedOnce,
    setMyCommentsLoadingMore,
    setMyCommentsNextCursor,
    setMyPage,
    setNotice,
    setPlaces,
    setProviders,
    setSelectedFestivalId,
    setSelectedPlaceId,
    setSessionUser,
    setStampState,
  ]);
}

export function useFestivalBootstrapEffect({
  reportBackgroundErrorRef,
  setFestivals,
  setSelectedFestivalId,
}: Pick<AppBootstrapSharedRefs, 'reportBackgroundErrorRef'> & {
  setFestivals: Dispatch<SetStateAction<FestivalItem[]>>;
  setSelectedFestivalId: (updater: (current: string | null) => string | null) => void;
}) {
  useEffect(() => {
    let active = true;

    void bootstrapFestivalLoader({
      setFestivals,
      setSelectedFestivalId,
      isActive: () => active,
    }).catch((error) => reportBackgroundErrorRef.current(error));

    return () => {
      active = false;
    };
  }, [reportBackgroundErrorRef, setFestivals, setSelectedFestivalId]);
}
