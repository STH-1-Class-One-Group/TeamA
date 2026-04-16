import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useAppTabWarmup } from './useAppTabWarmup';
import { useSelectedPlaceReviewSync } from './useSelectedPlaceReviewSync';
import { useAppBootstrapSharedRefs } from './useAppBootstrapSharedRefs';
import { useFestivalBootstrapEffect, useMapBootstrapEffect } from './useAppBootstrapEffects';
import { useAppBootstrapStoreBindings } from './useAppBootstrapStoreBindings';
import type {
  AdminSummaryResponse,
  FestivalItem,
  MyPageResponse,
  Place,
  Review,
  SessionUser,
  StampState,
  Tab,
} from '../types';

interface UseAppBootstrapLifecycleParams {
  activeTab: Tab;
  selectedPlaceId: string | null;
  sessionUser: SessionUser | null;
  myPage: MyPageResponse | null;
  myPageTab: string;
  adminSummary: AdminSummaryResponse | null;
  communityRouteSort: 'popular' | 'latest';
  myCommentsLoadedOnce: boolean;
  placeReviewsCacheRef: MutableRefObject<Record<string, Review[]>>;
  setPlaces: Dispatch<SetStateAction<Place[]>>;
  setFestivals: Dispatch<SetStateAction<FestivalItem[]>>;
  setStampState: Dispatch<SetStateAction<StampState>>;
  setHasRealData: Dispatch<SetStateAction<boolean>>;
  setSelectedPlaceReviews: Dispatch<SetStateAction<Review[]>>;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  resetReviewCaches: () => void;
  refreshMyPageForUser: (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null>;
  ensureFeedReviews: (force?: boolean) => Promise<void>;
  fetchCommunityRoutes: (sort: 'popular' | 'latest', force?: boolean) => Promise<unknown>;
  refreshAdminSummary: (force?: boolean) => Promise<AdminSummaryResponse | null>;
  loadMoreMyComments: (initial?: boolean) => Promise<void>;
  goToTab: (tab: Tab, historyMode?: 'push' | 'replace') => void;
  formatErrorMessage: (error: unknown) => string;
  reportBackgroundError: (error: unknown) => void;
}

export function useAppBootstrapLifecycle({
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
}: UseAppBootstrapLifecycleParams) {
  const bootstrapBindings = useAppBootstrapStoreBindings();

  const sharedRefs = useAppBootstrapSharedRefs({
    refreshMyPageForUser,
    resetReviewCaches,
    goToTab,
    formatErrorMessage,
    reportBackgroundError,
  });

  useSelectedPlaceReviewSync({
    activeTab,
    selectedPlaceId,
    placeReviewsCacheRef,
    setSelectedPlaceReviews,
    reportBackgroundError,
  });

  useAppTabWarmup({
    activeTab,
    sessionUser,
    myPage,
    myPageTab,
    adminSummary,
    communityRouteSort,
    myCommentsLoadedOnce,
    ensureFeedReviews,
    fetchCommunityRoutes,
    refreshMyPageForUser,
    refreshAdminSummary,
    loadMoreMyComments,
    reportBackgroundError,
  });

  useMapBootstrapEffect({
    ...sharedRefs,
    setBootstrapStatus: bootstrapBindings.setBootstrapStatus,
    setBootstrapError: bootstrapBindings.setBootstrapError,
    setPlaces,
    setStampState,
    setHasRealData,
    setSessionUser: bootstrapBindings.setSessionUser,
    setFeedNextCursor: bootstrapBindings.setFeedNextCursor,
    setFeedHasMore: bootstrapBindings.setFeedHasMore,
    setFeedLoadingMore: bootstrapBindings.setFeedLoadingMore,
    setMyCommentsNextCursor: bootstrapBindings.setMyCommentsNextCursor,
    setMyCommentsHasMore: bootstrapBindings.setMyCommentsHasMore,
    setMyCommentsLoadingMore: bootstrapBindings.setMyCommentsLoadingMore,
    setMyCommentsLoadedOnce: bootstrapBindings.setMyCommentsLoadedOnce,
    setProviders: bootstrapBindings.setProviders,
    setSelectedPlaceId: bootstrapBindings.setSelectedPlaceId,
    setSelectedFestivalId: bootstrapBindings.setSelectedFestivalId,
    setMyPage,
    setNotice: bootstrapBindings.setNotice,
  });

  useFestivalBootstrapEffect({
    reportBackgroundErrorRef: sharedRefs.reportBackgroundErrorRef,
    setFestivals,
    setSelectedFestivalId: bootstrapBindings.setSelectedFestivalId,
  });
}
