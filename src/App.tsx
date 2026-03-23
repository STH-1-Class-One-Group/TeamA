import { useEffect, useMemo, useState } from 'react';
import {
  getAuthSession,
  getFestivals,
  getMapBootstrap,
  getMyCommentsPage,
  getProviderLoginUrl,
  getReviewDetail,
  getReviewFeedPage,
  getReviews,
} from './api/client';
import { BottomNav } from './components/BottomNav';
import { CourseTab } from './components/CourseTab';
import { EventTab } from './components/EventTab';
import { FeedTab } from './components/FeedTab';
import { FloatingBackButton } from './components/FloatingBackButton';
import { MapTabStage } from './components/MapTabStage';
import { MyPagePanel } from './components/MyPagePanel';
import {
  useAppRouteState,
  clearAuthQueryParams,
  getInitialNotice,
  getLoginReturnUrl,
  getInitialMapViewport,
  updateMapViewportInUrl,
} from './hooks/useAppRouteState';
import { useAppDataState } from './hooks/useAppDataState';
import { useAppTabDataLoaders } from './hooks/useAppTabDataLoaders';
import { useAppMutationActions } from './hooks/useAppMutationActions';
import { useAppUIStore } from './store/app-ui-store';
import { useAppRuntimeStore } from './store/app-runtime-store';
import { getCurrentDevicePosition } from './lib/geolocation';
import {
  calculateDistanceMeters,
  formatDistanceMeters,
  getLatestPlaceStamp,
  getPlaceVisitCount,
  getTodayStampLog,
} from './lib/visits';
import type {
  ApiStatus,
  Category,
  CommunityRouteSort,
  FestivalItem,
  Place,
  ReviewMood,
  RoutePreview,
  SessionUser,
  Tab,
} from './types';

const STAMP_UNLOCK_RADIUS_METERS = 120;



function filterPlacesByCategory(places: Place[], category: Category) {
  if (category === 'all') {
    return places;
  }

  return places.filter((place) => place.category === category);
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '\uC694\uCCAD\uC744 \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uB4A4\uC5D0 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
}

function reportBackgroundError(error: unknown) {
  console.error(error);
}

function TabPanelFallback() {
  return (
    <section className="page-panel page-panel--scrollable page-panel--loading">
      <div className="page-panel__loading-copy">Loading...</div>
    </section>
  );
}

export default function App() {
  const {
    activeTab,
    drawerState,
    selectedPlaceId,
    selectedFestivalId,
    setSelectedPlaceId,
    setSelectedFestivalId,
    commitRouteState,
    goToTab,
    openPlace,
    openFestival,
    closeDrawer,
  } = useAppRouteState();

  const [initialMapViewport] = useState(getInitialMapViewport);

  const myPageTab = useAppUIStore((state) => state.myPageTab);
  const setMyPageTab = useAppUIStore((state) => state.setMyPageTab);
  const feedPlaceFilterId = useAppUIStore((state) => state.feedPlaceFilterId);
  const setFeedPlaceFilterId = useAppUIStore((state) => state.setFeedPlaceFilterId);
  const activeCategory = useAppUIStore((state) => state.activeCategory);
  const setActiveCategory = useAppUIStore((state) => state.setActiveCategory);
  const notice = useAppRuntimeStore((state) => state.notice);
  const setNotice = useAppRuntimeStore((state) => state.setNotice);
  const currentPosition = useAppRuntimeStore((state) => state.currentPosition);
  const setCurrentPosition = useAppRuntimeStore((state) => state.setCurrentPosition);
  const mapLocationStatus = useAppRuntimeStore((state) => state.mapLocationStatus);
  const setMapLocationStatus = useAppRuntimeStore((state) => state.setMapLocationStatus);
  const mapLocationMessage = useAppRuntimeStore((state) => state.mapLocationMessage);
  const setMapLocationMessage = useAppRuntimeStore((state) => state.setMapLocationMessage);
  const mapLocationFocusKey = useAppRuntimeStore((state) => state.mapLocationFocusKey);
  const setMapLocationFocusKey = useAppRuntimeStore((state) => state.setMapLocationFocusKey);
  const reviewSubmitting = useAppRuntimeStore((state) => state.reviewSubmitting);
  const setReviewSubmitting = useAppRuntimeStore((state) => state.setReviewSubmitting);
  const reviewError = useAppRuntimeStore((state) => state.reviewError);
  const setReviewError = useAppRuntimeStore((state) => state.setReviewError);
  const reviewLikeUpdatingId = useAppRuntimeStore((state) => state.reviewLikeUpdatingId);
  const setReviewLikeUpdatingId = useAppRuntimeStore((state) => state.setReviewLikeUpdatingId);
  const commentSubmittingReviewId = useAppRuntimeStore((state) => state.commentSubmittingReviewId);
  const setCommentSubmittingReviewId = useAppRuntimeStore((state) => state.setCommentSubmittingReviewId);
  const commentMutatingId = useAppRuntimeStore((state) => state.commentMutatingId);
  const setCommentMutatingId = useAppRuntimeStore((state) => state.setCommentMutatingId);
  const deletingReviewId = useAppRuntimeStore((state) => state.deletingReviewId);
  const setDeletingReviewId = useAppRuntimeStore((state) => state.setDeletingReviewId);
  const activeCommentReviewId = useAppUIStore((state) => state.activeCommentReviewId);
  const setActiveCommentReviewId = useAppUIStore((state) => state.setActiveCommentReviewId);
  const highlightedCommentId = useAppUIStore((state) => state.highlightedCommentId);
  const setHighlightedCommentId = useAppUIStore((state) => state.setHighlightedCommentId);
  const highlightedReviewId = useAppUIStore((state) => state.highlightedReviewId);
  const setHighlightedReviewId = useAppUIStore((state) => state.setHighlightedReviewId);
  const returnView = useAppUIStore((state) => state.returnView);
  const setReturnView = useAppUIStore((state) => state.setReturnView);
  const stampActionStatus = useAppRuntimeStore((state) => state.stampActionStatus);
  const setStampActionStatus = useAppRuntimeStore((state) => state.setStampActionStatus);
  const stampActionMessage = useAppRuntimeStore((state) => state.stampActionMessage);
  const setStampActionMessage = useAppRuntimeStore((state) => state.setStampActionMessage);
  const routeSubmitting = useAppRuntimeStore((state) => state.routeSubmitting);
  const setRouteSubmitting = useAppRuntimeStore((state) => state.setRouteSubmitting);
  const routeError = useAppRuntimeStore((state) => state.routeError);
  const setRouteError = useAppRuntimeStore((state) => state.setRouteError);
  const routeLikeUpdatingId = useAppRuntimeStore((state) => state.routeLikeUpdatingId);
  const setRouteLikeUpdatingId = useAppRuntimeStore((state) => state.setRouteLikeUpdatingId);
  const profileSaving = useAppRuntimeStore((state) => state.profileSaving);
  const setProfileSaving = useAppRuntimeStore((state) => state.setProfileSaving);
  const profileError = useAppRuntimeStore((state) => state.profileError);
  const setProfileError = useAppRuntimeStore((state) => state.setProfileError);
  const myPageError = useAppRuntimeStore((state) => state.myPageError);
  const setMyPageError = useAppRuntimeStore((state) => state.setMyPageError);
  const isLoggingOut = useAppRuntimeStore((state) => state.isLoggingOut);
  const setIsLoggingOut = useAppRuntimeStore((state) => state.setIsLoggingOut);
  const feedNextCursor = useAppRuntimeStore((state) => state.feedNextCursor);
  const setFeedNextCursor = useAppRuntimeStore((state) => state.setFeedNextCursor);
  const feedHasMore = useAppRuntimeStore((state) => state.feedHasMore);
  const setFeedHasMore = useAppRuntimeStore((state) => state.setFeedHasMore);
  const feedLoadingMore = useAppRuntimeStore((state) => state.feedLoadingMore);
  const setFeedLoadingMore = useAppRuntimeStore((state) => state.setFeedLoadingMore);
  const myCommentsNextCursor = useAppRuntimeStore((state) => state.myCommentsNextCursor);
  const setMyCommentsNextCursor = useAppRuntimeStore((state) => state.setMyCommentsNextCursor);
  const myCommentsHasMore = useAppRuntimeStore((state) => state.myCommentsHasMore);
  const setMyCommentsHasMore = useAppRuntimeStore((state) => state.setMyCommentsHasMore);
  const myCommentsLoadingMore = useAppRuntimeStore((state) => state.myCommentsLoadingMore);
  const setMyCommentsLoadingMore = useAppRuntimeStore((state) => state.setMyCommentsLoadingMore);
  const myCommentsLoadedOnce = useAppRuntimeStore((state) => state.myCommentsLoadedOnce);
  const setMyCommentsLoadedOnce = useAppRuntimeStore((state) => state.setMyCommentsLoadedOnce);

  const {
    bootstrapStatus,
    setBootstrapStatus,
    bootstrapError,
    setBootstrapError,
    places,
    setPlaces,
    festivals,
    setFestivals,
    reviews,
    setReviews,
    selectedPlaceReviews,
    setSelectedPlaceReviews,
    courses,
    setCourses,
    stampState,
    setStampState,
    hasRealData,
    setHasRealData,
    sessionUser,
    setSessionUser,
    providers,
    setProviders,
    communityRoutes,
    setCommunityRoutes,
    communityRouteSort,
    setCommunityRouteSort,
    myPage,
    setMyPage,
    adminSummary,
    setAdminSummary,
    adminBusyPlaceId,
    setAdminBusyPlaceId,
    adminLoading,
    setAdminLoading,
    selectedRoutePreview,
    setSelectedRoutePreview,
    communityRoutesCacheRef,
    placeReviewsCacheRef,
    feedLoadedRef,
    coursesLoadedRef,
    replaceCommunityRoutes,
    patchCommunityRoutes,
    patchReviewCollections,
    upsertReviewCollections,
    resetReviewCaches,
  } = useAppDataState(selectedPlaceId);

  const filteredPlaces = useMemo(() => filterPlacesByCategory(places, activeCategory), [places, activeCategory]);
  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) {
      return null;
    }

    return places.find((place) => place.id === selectedPlaceId) ?? null;
  }, [places, selectedPlaceId]);
  const routePreviewPlaces = useMemo(() => {
    if (!selectedRoutePreview) {
      return [];
    }

    return selectedRoutePreview.placeIds
      .map((placeId) => places.find((place) => place.id === placeId) ?? null)
      .filter(Boolean) as Place[];
  }, [places, selectedRoutePreview]);

  const selectedFestival = useMemo(() => {
    if (!selectedFestivalId) {
      return null;
    }

    return festivals.find((festival) => festival.id === selectedFestivalId) ?? null;
  }, [festivals, selectedFestivalId]);
  const todayStamp = selectedPlace ? getTodayStampLog(stampState.logs, selectedPlace.id) : null;
  const latestStamp = selectedPlace ? getLatestPlaceStamp(stampState.logs, selectedPlace.id) : null;
  const visitCount = selectedPlace ? getPlaceVisitCount(stampState.logs, selectedPlace.id) : 0;
  const selectedPlaceDistanceMeters =
    selectedPlace && currentPosition
      ? calculateDistanceMeters(currentPosition.latitude, currentPosition.longitude, selectedPlace.latitude, selectedPlace.longitude)
      : null;
  const knownMyReviews = useMemo(() => {
    if (!sessionUser) {
      return [];
    }

    const reviewMap = new Map<string, (typeof reviews)[number]>();
    for (const review of [...reviews, ...selectedPlaceReviews, ...(myPage?.reviews ?? [])]) {
      if (review.userId !== sessionUser.id) {
        continue;
      }
      reviewMap.set(review.id, review);
    }

    return [...reviewMap.values()];
  }, [myPage?.reviews, reviews, selectedPlaceReviews, sessionUser]);
  const hasCreatedReviewToday = useMemo(() => {
    if (!sessionUser || !todayStamp) {
      return false;
    }

    return knownMyReviews.some((review) => review.stampId === todayStamp.id || review.visitedAt.startsWith(todayStamp.stampedDate));
  }, [knownMyReviews, sessionUser, todayStamp]);
  const canCreateReview = Boolean(sessionUser && selectedPlace && todayStamp && !hasCreatedReviewToday);
  const placeNameById = useMemo(() => Object.fromEntries(places.map((place) => [place.id, place.name])), [places]);
  const {
    fetchCommunityRoutes,
    ensureFeedReviews,
    ensureCuratedCourses,
    refreshAdminSummary,
    refreshMyPageForUser,
  } = useAppTabDataLoaders({
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
    setFeedHasMore,
    setFeedNextCursor,
    setCourses,
    setAdminLoading,
    setAdminSummary,
    setMyPage,
    setMyPageError,
  });

  const {
    handleClaimStamp,
    handleCreateReview,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
    handleDeleteReview,
    handleToggleReviewLike,
    handleToggleRouteLike,
    handlePublishRoute,
    handleToggleAdminPlace,
    handleToggleAdminManualOverride,
    handleRefreshAdminImport,
    handleUpdateProfile,
    handleLogout,
  } = useAppMutationActions({
    activeTab,
    sessionUser,
    selectedPlace,
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    myPageTab,
    feedPlaceFilterId,
    activeCommentReviewId,
    highlightedCommentId,
    highlightedReviewId,
    setHighlightedReviewId,
    setCommentSubmittingReviewId,
    setCommentMutatingId,
    setDeletingReviewId,
    setReviewLikeUpdatingId,
    setReviewSubmitting,
    setReviewError,
    setNotice,
    setCurrentPosition,
    setStampState,
    setStampActionStatus,
    refreshMyPageForUser,
    commitRouteState,
    goToTab,
    patchReviewCollections,
    upsertReviewCollections,
    setReviews,
    setSelectedPlaceReviews,
    placeReviewsCacheRef,
    setMyPage,
    handleCloseReviewComments,
    patchCommunityRoutes,
    setRouteLikeUpdatingId,
    setRouteSubmitting,
    setRouteError,
    communityRoutesCacheRef,
    setMyPageTab,
    setAdminBusyPlaceId,
    setAdminSummary,
    setPlaces,
    setHasRealData,
    setFestivals,
    refreshAdminSummary,
    setAdminLoading,
    setProfileSaving,
    setProfileError,
    setSessionUser,
    setProviders,
    setIsLoggingOut,
  });

  function handleOpenReviewComments(reviewId: string, commentId: string | null = null) {
    goToTab('feed');
    setHighlightedReviewId(reviewId ?? null);
    setActiveCommentReviewId(reviewId);
    setHighlightedCommentId(commentId);
  }

  function handleCloseReviewComments() {
    setActiveCommentReviewId(null);
    setHighlightedCommentId(null);
  }

  function handleOpenRoutePreview(route: RoutePreview) {
    if (activeTab !== 'map') {
      setReturnView({
        tab: activeTab,
        myPageTab,
        activeCommentReviewId,
        highlightedCommentId,
        highlightedReviewId,
        placeId: selectedPlaceId,
        festivalId: selectedFestivalId,
        drawerState,
        feedPlaceFilterId,
      });
    }
    setSelectedRoutePreview(route);
    handleCloseReviewComments();
    commitRouteState({ tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' }, activeTab === 'map' ? 'replace' : 'push');
  }

  function handleOpenPlaceWithReturn(placeId: string) {
    if (activeTab !== 'map') {
      const preserveFeedFocus = activeTab !== 'feed';
      setReturnView({
        tab: activeTab,
        myPageTab,
        activeCommentReviewId: preserveFeedFocus ? activeCommentReviewId : null,
        highlightedCommentId: preserveFeedFocus ? highlightedCommentId : null,
        highlightedReviewId: preserveFeedFocus ? highlightedReviewId : null,
        placeId: selectedPlaceId,
        festivalId: selectedFestivalId,
        drawerState,
        feedPlaceFilterId,
      });
    }
    setSelectedRoutePreview(null);
    openPlace(placeId);
  }


  function handleOpenFestivalWithReturn(festivalId: string) {
    if (activeTab !== 'map') {
      setReturnView({
        tab: activeTab,
        myPageTab,
        activeCommentReviewId,
        highlightedCommentId,
        highlightedReviewId,
        placeId: selectedPlaceId,
        festivalId: selectedFestivalId,
        drawerState,
        feedPlaceFilterId,
      });
    }
    setSelectedRoutePreview(null);
    openFestival(festivalId);
  }
  async function ensureReviewLoadedById(reviewId: string | null) {
    if (!reviewId) {
      return null;
    }

    const existing = [...reviews, ...selectedPlaceReviews, ...(myPage?.reviews ?? [])].find((review) => review.id === reviewId) ?? null;
    if (existing) {
      upsertReviewCollections(existing);
      return existing;
    }

    try {
      const loaded = await getReviewDetail(reviewId);
      upsertReviewCollections(loaded);
      return loaded;
    } catch (error) {
      setNotice(formatErrorMessage(error));
      return null;
    }
  }

  async function handleOpenReviewWithReturn(reviewId: string | null) {
    await ensureReviewLoadedById(reviewId);
    if (activeTab !== 'feed') {
      setReturnView({
        tab: activeTab,
        myPageTab,
        activeCommentReviewId,
        highlightedCommentId,
        highlightedReviewId,
        placeId: selectedPlaceId,
        festivalId: selectedFestivalId,
        drawerState,
        feedPlaceFilterId,
      });
    }
    setFeedPlaceFilterId(null);
    setHighlightedReviewId(reviewId);
    setHighlightedCommentId(null);
    setActiveCommentReviewId(null);
    goToTab('feed');
  }

  function handleOpenPlaceFeedWithReturn(placeId: string) {
    if (activeTab !== 'feed') {
      setReturnView({
        tab: activeTab,
        myPageTab,
        activeCommentReviewId,
        highlightedCommentId,
        highlightedReviewId,
        placeId: selectedPlaceId,
        festivalId: selectedFestivalId,
        drawerState,
        feedPlaceFilterId,
      });
    }
    setSelectedRoutePreview(null);
    setSelectedRoutePreview(null);
    setFeedPlaceFilterId(placeId);
    setHighlightedReviewId(null);
    setHighlightedCommentId(null);
    setActiveCommentReviewId(null);
    goToTab('feed');
  }

  async function loadMoreFeedReviews() {
    if (feedLoadingMore || !feedHasMore) {
      return;
    }

    setFeedLoadingMore(true);
    try {
      const page = await getReviewFeedPage({ cursor: feedNextCursor, limit: 10 });
      setReviews((current) => {
        const existingIds = new Set(current.map((review) => review.id));
        const nextItems = page.items.filter((review) => !existingIds.has(review.id));
        return [...current, ...nextItems];
      });
      setFeedNextCursor(page.nextCursor);
      setFeedHasMore(Boolean(page.nextCursor));
    } catch (error) {
      reportBackgroundError(error);
    } finally {
      setFeedLoadingMore(false);
    }
  }

  async function loadMoreMyComments(initial = false) {
    if (!sessionUser || !myPage) {
      return;
    }
    if (myCommentsLoadingMore || (!initial && !myCommentsHasMore)) {
      return;
    }

    setMyCommentsLoadingMore(true);
    setMyCommentsLoadedOnce(true);
    try {
      const page = await getMyCommentsPage({ cursor: initial ? null : myCommentsNextCursor, limit: 10 });
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        const base = initial ? [] : current.comments;
        const existingIds = new Set(base.map((comment) => comment.id));
        const nextItems = page.items.filter((comment) => !existingIds.has(comment.id));
        return {
          ...current,
          comments: [...base, ...nextItems],
        };
      });
      setMyCommentsNextCursor(page.nextCursor);
      setMyCommentsHasMore(Boolean(page.nextCursor));
    } catch (error) {
      reportBackgroundError(error);
    } finally {
      setMyCommentsLoadingMore(false);
    }
  }

  async function handleOpenCommentWithReturn(reviewId: string, commentId: string | null = null) {
    if (activeTab !== 'feed') {
      setReturnView({
        tab: activeTab,
        myPageTab,
        activeCommentReviewId,
        highlightedCommentId,
        highlightedReviewId,
        placeId: selectedPlaceId,
        festivalId: selectedFestivalId,
        drawerState,
        feedPlaceFilterId,
      });
    }
    await ensureReviewLoadedById(reviewId);
    handleOpenReviewComments(reviewId, commentId);
  }

  useEffect(() => {
    if (notice === null) {
      setNotice(getInitialNotice());
    }
  }, [notice, setNotice]);

  useEffect(() => {
    if (!selectedPlace) {
      setStampActionMessage('\uC7A5\uC18C\uB97C \uC120\uD0DD\uD558\uBA74 \uC624\uB298 \uC2A4\uD0EC\uD504 \uAC00\uB2A5 \uC5EC\uBD80\uB97C \uBC14\uB85C \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694.');
      return;
    }

    if (!sessionUser) {
      setStampActionMessage(`${selectedPlace.name}\uC5D0\uC11C \uC2A4\uD0EC\uD504\uB97C \uCC0D\uC73C\uB824\uBA74 \uBA3C\uC800 \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.`);
      return;
    }

    if (todayStamp) {
      setStampActionMessage(`${todayStamp.visitLabel} \uC624\uB298 \uC2A4\uD0EC\uD504\uB97C \uC774\uBBF8 \uCC0D\uC5C8\uC5B4\uC694.`);
      return;
    }

    if (typeof selectedPlaceDistanceMeters !== 'number') {
      setStampActionMessage('\uD604\uC7AC \uC704\uCE58\uB97C \uD655\uC778\uD558\uBA74 \uC624\uB298 \uC2A4\uD0EC\uD504 \uAC00\uB2A5 \uC5EC\uBD80\uB97C \uBC14\uB85C \uC548\uB0B4\uD574 \uB4DC\uB9B4\uAC8C\uC694.');
      return;
    }

    if (selectedPlaceDistanceMeters <= STAMP_UNLOCK_RADIUS_METERS) {
      setStampActionMessage(`\uD604\uC7A5 \uBC18\uACBD ${formatDistanceMeters(selectedPlaceDistanceMeters)} \uC548\uC774\uC5D0\uC694. \uC9C0\uAE08 \uBC14\uB85C \uC624\uB298 \uC2A4\uD0EC\uD504\uB97C \uCC0D\uC744 \uC218 \uC788\uC5B4\uC694.`);
      return;
    }

    setStampActionMessage(`\uD604\uC7A5\uAE4C\uC9C0 ${formatDistanceMeters(selectedPlaceDistanceMeters)} \uB0A8\uC544 \uC788\uC5B4\uC694. ${STAMP_UNLOCK_RADIUS_METERS}m \uC548\uC73C\uB85C \uB4E4\uC5B4\uC624\uBA74 \uC624\uB298 \uC2A4\uD0EC\uD504\uB97C \uCC0D\uC744 \uC218 \uC788\uC5B4\uC694.`);
  }, [selectedPlace, selectedPlaceDistanceMeters, sessionUser, todayStamp]);

  useEffect(() => {
    void loadApp(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      void ensureFeedReviews().catch(reportBackgroundError);
      return;
    }

    if (activeTab === 'course') {
      void ensureCuratedCourses().catch(reportBackgroundError);
      void fetchCommunityRoutes(communityRouteSort).catch(reportBackgroundError);
      return;
    }

    if (activeTab === 'my') {
      if (sessionUser && myPage === null) {
        void refreshMyPageForUser(sessionUser, true).catch(reportBackgroundError);
      }
      if (sessionUser?.isAdmin && myPageTab === 'admin' && adminSummary === null) {
        void refreshAdminSummary().catch(reportBackgroundError);
      }
      if (sessionUser && myPage && myPageTab === 'comments' && !myCommentsLoadedOnce) {
        void loadMoreMyComments(true);
      }
    }
  }, [
    activeTab,
    communityRouteSort,
    sessionUser,
    myPage,
    myPageTab,
    adminSummary,
    myCommentsLoadedOnce,
  ]);

  useEffect(() => {
    if (activeTab !== 'map') {
      setSelectedPlaceReviews([]);
      return;
    }

    if (!selectedPlaceId) {
      setSelectedPlaceReviews([]);
      return;
    }

    const cachedReviews = placeReviewsCacheRef.current[selectedPlaceId];
    if (cachedReviews) {
      setSelectedPlaceReviews(cachedReviews);
      return;
    }

    void getReviews({ placeId: selectedPlaceId })
      .then((nextReviews) => {
        placeReviewsCacheRef.current[selectedPlaceId] = nextReviews;
        setSelectedPlaceReviews(nextReviews);
      })
      .catch(reportBackgroundError);
  }, [activeTab, selectedPlaceId]);

  async function loadApp(withLoading: boolean) {
    const authParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
    const authState = authParams?.get('auth');

    if (withLoading) {
      setBootstrapStatus('loading');
    }
    setBootstrapError(null);

    try {
      const [bootstrap, festivalResult] = await Promise.all([
        getMapBootstrap(),
        getFestivals().catch(() => [] as FestivalItem[]),
      ]);

      setPlaces(bootstrap.places);
      setFestivals(festivalResult);
      setStampState(bootstrap.stamps);
      setHasRealData(bootstrap.hasRealData);
      setSessionUser(bootstrap.auth.user);
      resetReviewCaches();
      setFeedNextCursor(null);
      setFeedHasMore(false);
      setFeedLoadingMore(false);
      setMyCommentsNextCursor(null);
      setMyCommentsHasMore(false);
      setMyCommentsLoadingMore(false);
      setMyCommentsLoadedOnce(false);
      setProviders(bootstrap.auth.providers);
      setSelectedPlaceId((current) => (current && bootstrap.places.some((place) => place.id === current) ? current : null));
      setSelectedFestivalId((current) => (current && festivalResult.some((festival) => festival.id === current) ? current : null));

      if (bootstrap.auth.user) {
        if (activeTab === 'my') {
          await refreshMyPageForUser(bootstrap.auth.user, true);
        }
      } else {
        setMyPage(null);
      }

      setBootstrapStatus('ready');
      if (authState === 'naver-success' && bootstrap.auth.user?.profileCompletedAt === null) {
        goToTab('my');
        setNotice('닉네임을 먼저 정하면 같은 계정으로 스탬프와 피드를 이어서 남길 수 있어요.');
      }
    } catch (error) {
      setBootstrapError(formatErrorMessage(error));
      setBootstrapStatus('error');
    } finally {
      clearAuthQueryParams();
    }
  }

  async function refreshCurrentPosition(shouldFocusMap: boolean) {
    setMapLocationStatus('loading');
    setMapLocationMessage('현재 위치를 확인하고 있어요.');

    try {
      const nextPosition = await getCurrentDevicePosition();
      setCurrentPosition({ latitude: nextPosition.latitude, longitude: nextPosition.longitude });
      setMapLocationStatus('ready');
      setMapLocationMessage(`현재 위치를 확인했어요. 위치 정확도는 약 ${formatDistanceMeters(nextPosition.accuracyMeters)}예요.`);
      if (shouldFocusMap) {
        setMapLocationFocusKey((current) => current + 1);
      }
    } catch (error) {
      setCurrentPosition(null);
      setMapLocationStatus('error');
      setMapLocationMessage(formatErrorMessage(error));
    }
  }

  function startProviderLogin(provider: 'naver' | 'kakao') {
    window.location.assign(getProviderLoginUrl(provider, getLoginReturnUrl()));
  }

  const canNavigateBack =
    returnView !== null ||
    activeCommentReviewId !== null ||
    activeTab !== 'map' ||
    selectedPlaceId !== null ||
    selectedFestivalId !== null ||
    drawerState !== 'closed' ||
    selectedRoutePreview !== null ||
    (typeof window !== 'undefined' && window.history.length > 1);

  function handleNavigateBack() {
    if (returnView) {
      setMyPageTab(returnView.myPageTab);
      setActiveCommentReviewId(returnView.activeCommentReviewId);
      setHighlightedCommentId(returnView.highlightedCommentId);
      setHighlightedReviewId(returnView.highlightedReviewId);
      setFeedPlaceFilterId(returnView.feedPlaceFilterId);
      setSelectedRoutePreview(null);
      setSelectedRoutePreview(null);
      const nextTab = returnView.tab;
      setReturnView(null);
      commitRouteState(
        {
          tab: nextTab,
          placeId: nextTab === 'map' ? returnView.placeId : null,
          festivalId: nextTab === 'map' ? returnView.festivalId : null,
          drawerState: nextTab === 'map' ? returnView.drawerState : 'closed',
        },
        'replace',
      );
      return;
    }

    if (selectedRoutePreview) {
      setSelectedRoutePreview(null);
      return;
    }

    if (selectedRoutePreview) {
      setSelectedRoutePreview(null);
      return;
    }

    if (activeCommentReviewId !== null) {
      handleCloseReviewComments();
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }

    handleCloseReviewComments();
    goToTab('map', 'replace');
  }

  function handleBottomNavChange(nextTab: Tab) {
    setSelectedRoutePreview(null);
    handleCloseReviewComments();

    if (nextTab !== 'feed') {
      setFeedPlaceFilterId(null);
      setHighlightedReviewId(null);
    }

    if (nextTab === 'map') {
      commitRouteState(
        {
          tab: 'map',
          placeId: selectedPlaceId,
          festivalId: selectedFestivalId,
          drawerState,
        },
        'replace',
      );
      return;
    }

    commitRouteState(
      {
        tab: nextTab,
        placeId: null,
        festivalId: null,
        drawerState: 'closed',
      },
      'push',
    );
  }

  const reviewProofMessage = !sessionUser
    ? '\uB85C\uADF8\uC778\uD558\uBA74 \uC624\uB298 \uBC29\uBB38 \uC778\uC99D \uB4A4\uC5D0\uB9CC \uD53C\uB4DC\uB97C \uB0A8\uAE38 \uC218 \uC788\uC5B4\uC694.'
    : hasCreatedReviewToday
      ? '\uC624\uB298\uC740 \uC774\uBBF8 \uC774 \uC7A5\uC18C \uD53C\uB4DC\uB97C \uC791\uC131\uD588\uC5B4\uC694. \uD53C\uB4DC\uB294 \uD558\uB8E8\uC5D0 \uD558\uB098\uB9CC \uB0A8\uAE38 \uC218 \uC788\uC5B4\uC694.'
      : todayStamp
        ? `${todayStamp.visitLabel} \uBC29\uBB38 \uC2A4\uD0EC\uD504\uAC00 \uD655\uC778\uB410\uC5B4\uC694. \uC624\uB298 \uD53C\uB4DC \uD55C \uAC1C\uB97C \uC791\uC131\uD560 \uC218 \uC788\uC5B4\uC694.`
        : '\uC624\uB298 \uBC29\uBB38 \uC2A4\uD0EC\uD504\uB97C \uBA3C\uC800 \uCC0D\uC73C\uBA74 \uD53C\uB4DC\uB97C \uC791\uC131\uD560 \uC218 \uC788\uC5B4\uC694.';

  return (
    <div className="map-app-shell">
      <div className={activeTab === 'map' ? 'phone-shell phone-shell--map' : 'phone-shell'}>
        {activeTab === 'map' ? (
          <MapTabStage
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            notice={notice}
            bootstrapStatus={bootstrapStatus}
            bootstrapError={bootstrapError}
            filteredPlaces={filteredPlaces}
            festivals={festivals}
            selectedPlace={selectedPlace}
            selectedFestival={selectedFestival}
            currentPosition={currentPosition}
            mapLocationStatus={mapLocationStatus}
            mapLocationMessage={mapLocationMessage}
            mapLocationFocusKey={mapLocationFocusKey}
            drawerState={drawerState}
            sessionUser={sessionUser}
            selectedPlaceReviews={selectedPlaceReviews}
            routePreview={selectedRoutePreview}
            routePreviewPlaces={routePreviewPlaces}
            visitCount={visitCount}
            latestStamp={latestStamp}
            todayStamp={todayStamp}
            stampActionStatus={stampActionStatus}
            stampActionMessage={stampActionMessage}
            reviewProofMessage={reviewProofMessage}
            reviewError={reviewError}
            reviewSubmitting={reviewSubmitting}
            canCreateReview={canCreateReview}
            hasCreatedReviewToday={hasCreatedReviewToday}
            onOpenFeedReview={() => {
              if (!selectedPlace) {
                return;
              }
              handleOpenPlaceFeedWithReturn(selectedPlace.id);
            }}
            initialMapCenter={{ lat: initialMapViewport.lat, lng: initialMapViewport.lng }}
            initialMapZoom={initialMapViewport.zoom}
            onOpenPlace={(placeId) => {
              setSelectedRoutePreview(null);
              openPlace(placeId);
            }}
            onOpenFestival={(festivalId) => {
              setSelectedRoutePreview(null);
              openFestival(festivalId);
            }}
            onCloseDrawer={closeDrawer}
            onClearRoutePreview={() => setSelectedRoutePreview(null)}
            onExpandPlaceDrawer={() =>
              selectedPlace &&
              commitRouteState({ tab: 'map', placeId: selectedPlace.id, festivalId: null, drawerState: 'full' }, 'replace')
            }
            onCollapsePlaceDrawer={() =>
              selectedPlace &&
              commitRouteState({ tab: 'map', placeId: selectedPlace.id, festivalId: null, drawerState: 'partial' }, 'replace')
            }
            onExpandFestivalDrawer={() =>
              selectedFestival &&
              commitRouteState({ tab: 'map', placeId: null, festivalId: selectedFestival.id, drawerState: 'full' }, 'replace')
            }
            onCollapseFestivalDrawer={() =>
              selectedFestival &&
              commitRouteState({ tab: 'map', placeId: null, festivalId: selectedFestival.id, drawerState: 'partial' }, 'replace')
            }
            onRequestLogin={() => goToTab('my')}
            onClaimStamp={handleClaimStamp}
            onCreateReview={handleCreateReview}
            onLocateCurrentPosition={() => void refreshCurrentPosition(true)}
            onMapViewportChange={updateMapViewportInUrl}
          />
        ) : (
          <div className="page-stage">

            {activeTab === 'feed' && (
              <FeedTab
                reviews={reviews}
                sessionUser={sessionUser}
                reviewLikeUpdatingId={reviewLikeUpdatingId}
                placeFilterId={feedPlaceFilterId}
                placeFilterName={feedPlaceFilterId ? placeNameById[feedPlaceFilterId] ?? null : null}
                commentSubmittingReviewId={commentSubmittingReviewId}
                commentMutatingId={commentMutatingId}
                deletingReviewId={deletingReviewId}
                activeCommentReviewId={activeCommentReviewId}
                highlightedCommentId={highlightedCommentId}
                highlightedReviewId={highlightedReviewId}
                hasMore={feedHasMore && !feedPlaceFilterId}
                loadingMore={feedLoadingMore}
                onLoadMore={loadMoreFeedReviews}
                onToggleReviewLike={handleToggleReviewLike}
                onCreateComment={handleCreateComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onDeleteReview={handleDeleteReview}
                onRequestLogin={() => goToTab('my')}
                onClearPlaceFilter={() => setFeedPlaceFilterId(null)}
                onOpenPlace={handleOpenPlaceWithReturn}
                onOpenComments={handleOpenReviewComments}
                onCloseComments={handleCloseReviewComments}
              />
            )}

            {activeTab === 'event' && (
              <EventTab festivals={festivals} onOpenFestival={handleOpenFestivalWithReturn} />
            )}

            {activeTab === 'course' && (
              <CourseTab
                curatedCourses={courses}
                communityRoutes={communityRoutes}
                sort={communityRouteSort}
                sessionUser={sessionUser}
                routeLikeUpdatingId={routeLikeUpdatingId}
                placeNameById={placeNameById}
                onChangeSort={(sort) => {
                  setCommunityRouteSort(sort);
                  void fetchCommunityRoutes(sort)
                    .catch(reportBackgroundError);
                }}
                onToggleLike={handleToggleRouteLike}
                onOpenPlace={handleOpenPlaceWithReturn}
                onOpenRoutePreview={handleOpenRoutePreview}
                onRequestLogin={() => goToTab('my')}
              />
            )}

            {activeTab === 'my' && (
              <MyPagePanel
                sessionUser={sessionUser}
                myPage={myPage}
                providers={providers}
                myPageError={myPageError}
                activeTab={myPageTab}
                isLoggingOut={isLoggingOut}
                profileSaving={profileSaving}
                profileError={profileError}
                routeSubmitting={routeSubmitting}
                routeError={routeError}
                adminSummary={adminSummary}
                adminBusyPlaceId={adminBusyPlaceId}
                adminLoading={adminLoading}
                onChangeTab={setMyPageTab}
                onLogin={startProviderLogin}
                onRetry={async () => { if (sessionUser) { await refreshMyPageForUser(sessionUser, true); } }}
                onLogout={handleLogout}
                onSaveNickname={handleUpdateProfile}
                onPublishRoute={handlePublishRoute}
                onOpenPlace={handleOpenPlaceWithReturn}
                onOpenComment={(reviewId, commentId) => handleOpenCommentWithReturn(reviewId, commentId)}
                onOpenReview={handleOpenReviewWithReturn}
                onDeleteReview={handleDeleteReview}
                commentsHasMore={myCommentsHasMore}
                commentsLoadingMore={myCommentsLoadingMore}
                onLoadMoreComments={loadMoreMyComments}
                onRefreshAdmin={handleRefreshAdminImport}
                onToggleAdminPlace={handleToggleAdminPlace}
                onToggleAdminManualOverride={handleToggleAdminManualOverride}
              />
            )}
          </div>
        )}

        {canNavigateBack && <FloatingBackButton onNavigateBack={handleNavigateBack} />}

        <BottomNav activeTab={activeTab} onChange={handleBottomNavChange} />
      </div>
    </div>
  );
}

