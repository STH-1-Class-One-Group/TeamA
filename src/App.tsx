import { useEffect, useMemo, useState } from 'react';
import {
  claimStamp,
  createComment,
  updateComment,
  deleteComment,
  deleteReview,
  createReview,
  createUserRoute,
  getCommunityRoutes,
  getCuratedCourses,
  getAdminSummary,
  getFestivals,
  getMapBootstrap,
  getMySummary,
  getProviderLoginUrl,
  getReviews,
  logout,
  toggleCommunityRouteLike,
  toggleReviewLike,
  updatePlaceVisibility,
  updateProfile,
  uploadReviewImage,
} from './api/client';
import { BottomNav } from './components/BottomNav';
import { CourseTab } from './components/CourseTab';
import { FeedTab } from './components/FeedTab';
import { MapTabStage } from './components/MapTabStage';
import { MyPagePanel } from './components/MyPagePanel';
import { useAppRouteState, clearAuthQueryParams, getInitialNotice, getLoginReturnUrl, getInitialMapViewport, updateMapViewportInUrl } from './hooks/useAppRouteState';
import { useAppDataState } from './hooks/useAppDataState';
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
  AuthProvider,
  BootstrapResponse,
  Category,
  CommunityRouteSort,
  FestivalItem,
  AdminSummaryResponse,
  MyPageResponse,
  MyPageTabKey,
  Place,
  ReviewMood,
  SessionUser,
  Tab,
  UserRoute,
  DrawerState,
  RoutePreview,
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

  return '??븐슙???嶺뚳퐣瑗???? 嶺뚮쪇沅?쭛??怨몃뭵.';
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

  const [myPageTab, setMyPageTab] = useState<MyPageTabKey>('stamps');
  const [feedPlaceFilterId, setFeedPlaceFilterId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [notice, setNotice] = useState<string | null>(getInitialNotice);
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapLocationStatus, setMapLocationStatus] = useState<ApiStatus>('idle');
  const [mapLocationMessage, setMapLocationMessage] = useState<string | null>(null);
  const [mapLocationFocusKey, setMapLocationFocusKey] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewLikeUpdatingId, setReviewLikeUpdatingId] = useState<string | null>(null);
  const [commentSubmittingReviewId, setCommentSubmittingReviewId] = useState<string | null>(null);
  const [commentMutatingId, setCommentMutatingId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [activeCommentReviewId, setActiveCommentReviewId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);
  const [returnView, setReturnView] = useState<{
    tab: Tab;
    myPageTab: MyPageTabKey;
    activeCommentReviewId: string | null;
    highlightedCommentId: string | null;
    highlightedReviewId: string | null;
    placeId: string | null;
    festivalId: string | null;
    drawerState: DrawerState;
    feedPlaceFilterId: string | null;
  } | null>(null);
  const [stampActionStatus, setStampActionStatus] = useState<ApiStatus>('idle');
  const [stampActionMessage, setStampActionMessage] = useState('??????????? ??? ????????????????? ?????????.');
  const [routeSubmitting, setRouteSubmitting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLikeUpdatingId, setRouteLikeUpdatingId] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  const canCreateReview = Boolean(sessionUser && selectedPlace && todayStamp);
  const placeNameById = useMemo(() => Object.fromEntries(places.map((place) => [place.id, place.name])), [places]);
  async function fetchCommunityRoutes(sort: CommunityRouteSort, force = false) {
    const cached = communityRoutesCacheRef.current[sort];
    if (!force && cached) {
      setCommunityRoutes(cached);
      return cached;
    }

    const nextRoutes = await getCommunityRoutes(sort);
    replaceCommunityRoutes(nextRoutes, sort);
    return nextRoutes;
  }

  async function ensureFeedReviews(force = false) {
    if (!force && feedLoadedRef.current) {
      return;
    }

    const nextReviews = await getReviews();
    setReviews(nextReviews);
    feedLoadedRef.current = true;
  }

  async function ensureCuratedCourses(force = false) {
    if (!force && coursesLoadedRef.current) {
      return;
    }

    const response = await getCuratedCourses();
    setCourses(response.courses);
    coursesLoadedRef.current = true;
  }

  async function refreshAdminSummary(force = false) {
    if (!sessionUser?.isAdmin) {
      setAdminSummary(null);
      return null;
    }

    if (!force && activeTab !== 'my' && adminSummary !== null) {
      return adminSummary;
    }

    setAdminLoading(true);
    try {
      const nextSummary = await getAdminSummary();
      setAdminSummary(nextSummary);
      return nextSummary;
    } finally {
      setAdminLoading(false);
    }
  }

  async function refreshMyPageForUser(user: SessionUser | null, force = false) {
    if (!user) {
      setMyPage(null);
      return null;
    }

    if (!force && activeTab !== 'my' && myPage === null) {
      return null;
    }

    const nextMyPage = await getMySummary();
    setMyPage(nextMyPage);
    return nextMyPage;
  }

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
    openPlace(placeId);
  }

  function handleOpenReviewWithReturn(reviewId: string | null) {
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

  function handleOpenCommentWithReturn(reviewId: string, commentId: string | null = null) {
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
    handleOpenReviewComments(reviewId, commentId);
  }

  useEffect(() => {
    void loadApp(true);
  }, []);

  useEffect(() => {
    if (activeTab !== 'map' || mapLocationStatus !== 'idle') {
      return;
    }

    void refreshCurrentPosition(false);
  }, [activeTab, mapLocationStatus]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (activeTab === 'my' && sessionUser && !myPage) {
      void refreshMyPageForUser(sessionUser, true);
    }
    if (activeTab === 'my' && sessionUser?.isAdmin && !adminSummary) {
      void refreshAdminSummary(true).catch((error) => {
        setNotice(formatErrorMessage(error));
      });
    }
  }, [activeTab, adminSummary, myPage, sessionUser]);

  useEffect(() => {
    if (activeTab !== 'course') {
      return;
    }

    void ensureCuratedCourses().catch((error) => {
      setNotice(formatErrorMessage(error));
    });

    const cached = communityRoutesCacheRef.current[communityRouteSort];
    if (cached) {
      setCommunityRoutes(cached);
      return;
    }

    void fetchCommunityRoutes(communityRouteSort, true).catch((error) => {
      setNotice(formatErrorMessage(error));
    });
  }, [activeTab, communityRouteSort]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (communityRoutesCacheRef.current[communityRouteSort]) {
      return;
    }

    const run = () => {
      void fetchCommunityRoutes(communityRouteSort, true).catch(() => {});
    };

    const timeout = window.setTimeout(run, 180);
    return () => window.clearTimeout(timeout);
  }, [communityRouteSort]);

  useEffect(() => {
    if (activeTab !== 'feed' && activeCommentReviewId === null) {
      return;
    }

    void ensureFeedReviews().catch((error) => {
      setNotice(formatErrorMessage(error));
    });
  }, [activeCommentReviewId, activeTab]);

  useEffect(() => {
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
      .catch((error) => {
        setNotice(formatErrorMessage(error));
      });
  }, [selectedPlaceId]);

  useEffect(() => {
    if (activeTab !== 'feed' && activeCommentReviewId !== null) {
      setActiveCommentReviewId(null);
      setHighlightedCommentId(null);
    }
  }, [activeCommentReviewId, activeTab]);

  function handleBottomNavChange(nextTab: Tab) {
    setReturnView(null);
    if (nextTab !== 'map') {
      setSelectedRoutePreview(null);
    }
    if (nextTab !== 'feed') {
      setActiveCommentReviewId(null);
      setHighlightedCommentId(null);
      setHighlightedReviewId(null);
    }
    if (nextTab === 'feed') {
      setFeedPlaceFilterId(null);
    }
    goToTab(nextTab);
  }

  useEffect(() => {
    if (!selectedPlaceId) {
      return;
    }

    const isVisibleInCurrentCategory = filteredPlaces.some((place) => place.id === selectedPlaceId);
    if (!isVisibleInCurrentCategory) {
      commitRouteState(
        {
          tab: 'map',
          placeId: null,
          festivalId: null,
          drawerState: 'closed',
        },
        'replace',
      );
    }
  }, [commitRouteState, filteredPlaces, selectedPlaceId]);

  useEffect(() => {
    if (!selectedPlace) {
      setStampActionMessage('????섎ご???ルㅎ臾??濡?듆 ???노츓 ???꾪땿???띠럾?????????꾩룆?餓???????類싲뎅?롪퍓???');
      return;
    }

    if (!sessionUser) {
      setStampActionMessage(`?β돦裕??筌뤿굝由?춯?${selectedPlace.name}??????꾩룆?餓??熬곣뫗?????꾪땿?熬? 嶺뚣볦뵰???????곗꽑??`);
      return;
    }

    if (todayStamp) {
      setStampActionMessage(`${todayStamp.visitLabel} ???꾪땿?熬? ???? 嶺뚣볦뵰?됀??怨몃뭵. ???노츓 ??怨뺢덧?? ?袁⑤뾼??놁뿉??꾩룆?餓???怨룹꽑???????곗꽑??`);
      return;
    }

    if (typeof selectedPlaceDistanceMeters !== 'number') {
      setStampActionMessage('?熬곣뫗???熬곣뫚????筌먦끉逾??濡?듆 ???꾪땿???띠럾?????????꾩룆?餓???????類싲뎅?롪퍓???');
      return;
    }

    if (selectedPlaceDistanceMeters <= STAMP_UNLOCK_RADIUS_METERS) {
      setStampActionMessage(`?熬곣뫗????${formatDistanceMeters(selectedPlaceDistanceMeters)} 濾곌쑨?????깅뭵. 嶺뚯솘????꾩룆?餓????꾪땿?熬? 嶺뚣볦뵰???????곗꽑??`);
      return;
    }

    setStampActionMessage(`?熬곣뫗????${formatDistanceMeters(selectedPlaceDistanceMeters)} 濾곌쑨?????깅뭵. ${STAMP_UNLOCK_RADIUS_METERS}m ???깅さ?????곗꽑???좊듆 ???꾪땿?熬? ??????`);
  }, [selectedPlace, selectedPlaceDistanceMeters, sessionUser, todayStamp]);

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
        setNotice('??怨뚰맟?熬곣뫗諭??誘る닔? ???繞③뇡?彛??꾩룆?餓???怨뺢덧?? ?袁⑤뾼??놁뿉???怨룹꽑???????곗꽑??');
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
    setMapLocationMessage('?熬곣뫗???熬곣뫚????筌먦끉逾???겶????곗꽑??');

    try {
      const nextPosition = await getCurrentDevicePosition();
      setCurrentPosition({ latitude: nextPosition.latitude, longitude: nextPosition.longitude });
      setMapLocationStatus('ready');
      setMapLocationMessage(`?熬곣뫗???熬곣뫚??????곕뻣 ???뗫┃??怨몃뭵. ????쭜 ???⑥빵????${formatDistanceMeters(nextPosition.accuracyMeters)}???깅뭵.`);
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

  async function handleClaimStamp(place: Place) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('?β돦裕??筌뤿굝????熬곣뫗?????꾪땿?熬? 嶺뚣볦뵰???????곗꽑??');
      return;
    }

    setStampActionStatus('loading');
    try {
      const nextPosition = await getCurrentDevicePosition();
      setCurrentPosition({ latitude: nextPosition.latitude, longitude: nextPosition.longitude });
      const nextStampState = await claimStamp({
        placeId: place.id,
        latitude: nextPosition.latitude,
        longitude: nextPosition.longitude,
      });
      setStampState(nextStampState);
      setNotice(`${place.name}????????노츓 ???꾪땿?熬? 嶺뚣볦뵰?됀??怨몃뭵.`);
      commitRouteState(
        {
          tab: 'map',
          placeId: place.id,
          festivalId: null,
          drawerState: 'full',
        },
        'replace',
      );
      await refreshMyPageForUser(sessionUser);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setStampActionStatus('ready');
    }
  }

  async function handleCreateReview(payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) {
    if (!sessionUser || !selectedPlace) {
      goToTab('my');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      let imageUrl: string | null = null;
      if (payload.file) {
        const uploaded = await uploadReviewImage(payload.file);
        imageUrl = uploaded.url;
      }
      const createdReview = await createReview({
        placeId: selectedPlace.id,
        stampId: payload.stampId,
        body: payload.body.trim(),
        mood: payload.mood,
        imageUrl,
      });
      upsertReviewCollections(createdReview);
      await refreshMyPageForUser(sessionUser);
      setNotice('??怨뺢덧????節딇렩??怨몃뭵. ?띠룇?? ??筌???????怨쀬Ŧ ?袁⑤뾼??놃떐?? ??怨룹꽑???????곗꽑??');
      commitRouteState(
        {
          tab: 'map',
          placeId: selectedPlace.id,
          festivalId: null,
          drawerState: 'full',
        },
        'replace',
      );
    } catch (error) {
      setReviewError(formatErrorMessage(error));
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleCreateComment(reviewId: string, body: string, parentId?: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('?癰?????節뗢뵛???좊듆 ?誘る닔? ?β돦裕??筌뤿굝???낅슣?섋땻??');
      return;
    }

    setCommentSubmittingReviewId(reviewId);
    try {
      const updatedComments = await createComment(reviewId, { body, parentId: parentId ?? null });
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        comments: updatedComments,
        commentCount: updatedComments.length,
      }));
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentSubmittingReviewId(null);
    }
  }

  async function handleUpdateComment(reviewId: string, commentId: string, body: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('?癰?????瑜곸젧??濡?졎嶺??誘る닔? ?β돦裕??筌뤿굝???낅슣?섋땻??');
      return;
    }

    setCommentMutatingId(commentId);
    try {
      const updatedComments = await updateComment(reviewId, commentId, { body });
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        comments: updatedComments,
        commentCount: updatedComments.length,
      }));
      if (activeTab === 'my') {
        await refreshMyPageForUser(sessionUser, true);
      }
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentMutatingId(null);
    }
  }

  async function handleDeleteComment(reviewId: string, commentId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('?癰????????濡?졎嶺??誘る닔? ?β돦裕??筌뤿굝???낅슣?섋땻??');
      return;
    }

    setCommentMutatingId(commentId);
    try {
      const updatedComments = await deleteComment(reviewId, commentId);
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        comments: updatedComments,
        commentCount: updatedComments.length,
      }));
      if (activeTab === 'my') {
        await refreshMyPageForUser(sessionUser, true);
      }
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentMutatingId(null);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('??怨뺢덧???????濡?졎嶺??誘る닔? ?β돦裕??筌뤿굝???낅슣?섋땻??');
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setSelectedPlaceReviews((current) => current.filter((review) => review.id !== reviewId));
      for (const placeId of Object.keys(placeReviewsCacheRef.current)) {
        placeReviewsCacheRef.current[placeId] = placeReviewsCacheRef.current[placeId].filter((review) => review.id !== reviewId);
      }
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          reviews: current.reviews.filter((review) => review.id !== reviewId),
          comments: current.comments.filter((comment) => comment.reviewId !== reviewId),
          stats: {
            ...current.stats,
            reviewCount: Math.max(0, current.stats.reviewCount - 1),
          },
        };
      });
      if (activeCommentReviewId === reviewId) {
        handleCloseReviewComments();
      }
      if (highlightedReviewId === reviewId) {
        setHighlightedReviewId(null);
      }
      setNotice('??怨뺢덧????????곗꽑??');
      if (activeTab === 'my') {
        await refreshMyPageForUser(sessionUser, true);
      }
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function handleToggleReviewLike(reviewId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('??ル열???? ?熬곣뱿????좊듆 ?誘る닔? ?β돦裕??筌뤿굝???낅슣?섋땻??');
      return;
    }

    setReviewLikeUpdatingId(reviewId);
    try {
      const result = await toggleReviewLike(reviewId);
      patchReviewCollections(reviewId, (review) => ({
        ...review,
        likeCount: result.likeCount,
        likedByMe: result.likedByMe,
      }));
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setReviewLikeUpdatingId(null);
    }
  }

  async function handleToggleRouteLike(routeId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('??ル열???? ?熬곣뱿????좊듆 ?誘る닔? ?β돦裕??筌뤿굝???낅슣?섋땻??');
      return;
    }
    setRouteLikeUpdatingId(routeId);
    try {
      const result = await toggleCommunityRouteLike(routeId);
      patchCommunityRoutes(routeId, (route) => ({
        ...route,
        likeCount: result.likeCount,
        likedByMe: result.likedByMe,
      }));
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setRouteLikeUpdatingId(null);
    }
  }

  async function handlePublishRoute(payload: { travelSessionId: string; title: string; description: string; mood: string }) {
    if (!sessionUser) {
      goToTab('my');
      setRouteError('?β돦裕??筌뤿굝由????고뱺嶺???筌??筌뤾쑬????袁⑤뾼??놁뿉??꾩룇裕됵쭛???????곗꽑??');
      return;
    }
    setRouteSubmitting(true);
    setRouteError(null);
    try {
      const createdRoute = await createUserRoute({
        travelSessionId: payload.travelSessionId,
        title: payload.title,
        description: payload.description,
        mood: payload.mood,
        isPublic: true,
      });
      communityRoutesCacheRef.current = {
        ...communityRoutesCacheRef.current,
        latest: [createdRoute, ...(communityRoutesCacheRef.current.latest ?? []).filter((route) => route.id !== createdRoute.id)],
      };
      delete communityRoutesCacheRef.current.popular;
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        const routeExists = current.routes.some((route) => route.id === createdRoute.id);
        return {
          ...current,
          routes: [createdRoute, ...current.routes.filter((route) => route.id !== createdRoute.id)],
          travelSessions: current.travelSessions.map((session) =>
            session.id === payload.travelSessionId ? { ...session, publishedRouteId: createdRoute.id } : session,
          ),
          stats: {
            ...current.stats,
            routeCount: routeExists ? current.stats.routeCount : current.stats.routeCount + 1,
          },
        };
      });
      setNotice('??筌??筌뤾쑬?????ㅻ????袁⑤뾼??놁뿉??꾩룇裕됵쭛???곗꽑?? ??怨몄젷 ???섎???????利????롪퍔?δ빳?꾨ご????????곗꽑??');
      setMyPageTab('routes');
    } catch (error) {
      setRouteError(formatErrorMessage(error));
    } finally {
      setRouteSubmitting(false);
    }
  }

  async function handleToggleAdminPlace(placeId: string, nextValue: boolean) {
    if (!sessionUser?.isAdmin) {
      return;
    }
    setAdminBusyPlaceId(placeId);
    try {
      const updated = await updatePlaceVisibility(placeId, { isActive: nextValue });
      setAdminSummary((current) => current ? {
        ...current,
        places: current.places.map((place) => place.id === placeId ? updated : place),
      } : current);
      const nextMap = await getMapBootstrap();
      setPlaces(nextMap.places);
      setStampState(nextMap.stamps);
      setHasRealData(nextMap.hasRealData);
      setNotice(nextValue ? '\uC7A5\uC18C \uB178\uCD9C\uC744 \uCF1C\uB450\uC5C8\uC5B4\uC694.' : '\uC7A5\uC18C \uB178\uCD9C\uC744 \uC228\uACBC\uC5B4\uC694.');
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setAdminBusyPlaceId(null);
    }
  }

  async function handleUpdateProfile(nextNickname: string) {
    if (!nextNickname || nextNickname.length < 2) {
      setProfileError('??怨뚰맟?熬? ???リ섣?????怨대쭜??怨쀬Ŧ ???놁졑???낅슣?섋땻??');
      return;
    }
    setProfileSaving(true);
    setProfileError(null);
    try {
      const auth = await updateProfile({ nickname: nextNickname });
      setSessionUser(auth.user);
      if (auth.user) {
        setMyPage((current) => (current && auth.user ? { ...current, user: auth.user } : current));
      }
      setNotice('??怨뚰맟?熬곣뫗諭????繞⑨쭛??怨몃뭵. ??怨몄젷 嶺뚮∥?????????怨쀬Ŧ ?꾩룆?餓???怨룹꽑???????곗꽑??');
    } catch (error) {
      setProfileError(formatErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const auth = await logout();
      setSessionUser(auth.user);
      setProviders(auth.providers);
      setMyPage(null);
      setNotice('?β돦裕??熬곣뫗????곗꽑??');
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  const canNavigateBack = activeCommentReviewId !== null || activeTab !== 'map' || selectedPlaceId !== null || selectedFestivalId !== null || drawerState !== 'closed' || selectedRoutePreview !== null;

  function handleNavigateBack() {
    if (returnView && activeTab !== returnView.tab) {
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

  const reviewProofMessage = !sessionUser
    ? '?β돦裕??筌뤿굝由??????꾪땿?熬? 嶺뚣볦뵰?????怨뺢덧????얜?????????곗꽑??'
    : todayStamp
      ? `${todayStamp.visitLabel} ???꾪땿?熬? ???곗꽑?? 嶺뚯솘???????????怨뺢덧???꾩룆?餓???節뗭춸 ?????곗꽑??`
      : '???노츓 ???꾪땿?熬? 嶺뚣볦뵰??얠춺???怨뺢덧 ??얜????뺢퀗?????꾩룆?餓???????';

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
            {notice && <div className="floating-notice">{notice}</div>}
            {bootstrapStatus === 'loading' && <section className="floating-status">??븐뻼???繞벿뮻???들뇡??????곗꽑??</section>}
            {bootstrapStatus === 'error' && <section className="floating-status floating-status--error">{bootstrapError}</section>}

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
                    .catch((error) => setNotice(formatErrorMessage(error)));
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
                onLogout={handleLogout}
                onSaveNickname={handleUpdateProfile}
                onPublishRoute={handlePublishRoute}
                onOpenPlace={handleOpenPlaceWithReturn}
                onOpenComment={(reviewId, commentId) => handleOpenCommentWithReturn(reviewId, commentId)}
                onOpenReview={handleOpenReviewWithReturn}
                onDeleteReview={handleDeleteReview}
                onRefreshAdmin={async () => {
                  await refreshAdminSummary(true);
                }}
                onToggleAdminPlace={handleToggleAdminPlace}
              />
            )}
          </div>
        )}

        {canNavigateBack && (
          <button type="button" className="app-back-button" onClick={handleNavigateBack} aria-label="\uC774\uC804\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30">
            <span aria-hidden="true">&#8592;</span>
            <span>\uC774\uC804</span>
          </button>
        )}

        <BottomNav activeTab={activeTab} onChange={handleBottomNavChange} />
      </div>
    </div>
  );
}

