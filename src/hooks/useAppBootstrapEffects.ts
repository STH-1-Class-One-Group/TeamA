import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getFestivals, getMapBootstrap } from '../api/bootstrapClient';
import type {
  FestivalItem,
  MyPageResponse,
  Place,
  SessionUser,
  StampState,
} from '../types';
import { handleBootstrapAuthNotice } from './app-bootstrap/bootstrapAuthNotice';
import {
  applyBootstrapSelections,
  resetBootstrapRuntime,
  resetFestivalSelection,
} from './app-bootstrap/bootstrapRuntimeReset';
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
        const bootstrap = await getMapBootstrap();
        if (!active) {
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
          if (!active) {
            return;
          }
        } else {
          setMyPage(null);
        }

        setBootstrapStatus('ready');
        handleBootstrapAuthNotice({
          authState,
          user: bootstrap.auth.user,
          goToTab: goToTabRef.current,
          setNotice,
        });
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

    void getFestivals()
      .then((festivalResult) => {
        if (!active) {
          return;
        }
        setFestivals(festivalResult);
        resetFestivalSelection(
          festivalResult.map((festival) => festival.id),
          setSelectedFestivalId
        );
      })
      .catch((error) => reportBackgroundErrorRef.current(error));

    return () => {
      active = false;
    };
  }, [reportBackgroundErrorRef, setFestivals, setSelectedFestivalId]);
}
