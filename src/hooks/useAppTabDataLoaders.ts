import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { getAdminSummary, getCommunityRoutes, getCuratedCourses, getMySummary, getReviews } from '../api/client';
import type {
  AdminSummaryResponse,
  CommunityRouteSort,
  Course,
  MyPageResponse,
  Review,
  SessionUser,
  Tab,
  UserRoute,
} from '../types';

type CommunityRoutesCache = Partial<Record<CommunityRouteSort, UserRoute[]>>;

interface UseAppTabDataLoadersParams {
  activeTab: Tab;
  adminSummary: AdminSummaryResponse | null;
  myPage: MyPageResponse | null;
  sessionUser: SessionUser | null;
  communityRoutesCacheRef: MutableRefObject<CommunityRoutesCache>;
  feedLoadedRef: MutableRefObject<boolean>;
  coursesLoadedRef: MutableRefObject<boolean>;
  replaceCommunityRoutes: (nextRoutes: UserRoute[], sort?: CommunityRouteSort) => void;
  setCommunityRoutes: Dispatch<SetStateAction<UserRoute[]>>;
  setReviews: Dispatch<SetStateAction<Review[]>>;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  setAdminLoading: Dispatch<SetStateAction<boolean>>;
  setAdminSummary: Dispatch<SetStateAction<AdminSummaryResponse | null>>;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  setMyPageError: Dispatch<SetStateAction<string | null>>;
}

export function useAppTabDataLoaders({
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
  setMyPageError,
}: UseAppTabDataLoadersParams) {
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
      setMyPageError(null);
      return null;
    }

    if (!force && activeTab !== 'my' && myPage === null) {
      return null;
    }

    try {
      const nextMyPage = await getMySummary();
      setMyPage(nextMyPage);
      setMyPageError(null);
      return nextMyPage;
    } catch (error) {
      setMyPage(null);
      setMyPageError(error instanceof Error ? error.message : '마이페이지 정보를 불러오지 못했어요.');
      if (activeTab !== 'my') {
        return null;
      }
      throw error;
    }
  }

  return {
    fetchCommunityRoutes,
    ensureFeedReviews,
    ensureCuratedCourses,
    refreshAdminSummary,
    refreshMyPageForUser,
  };
}
