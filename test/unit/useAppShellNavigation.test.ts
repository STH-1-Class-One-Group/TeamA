import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppShellNavigation } from '../../src/hooks/useAppShellNavigation';
import type { RoutePreview, SessionUser } from '../../src/types';

const routePreview: RoutePreview = {
  id: 'route-1',
  title: '빵집 산책 코스',
  subtitle: 'tester / 04. 05. 12:00',
  mood: '데이트',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['첫 번째 장소', '두 번째 장소'],
};

describe('useAppShellNavigation', () => {
  const sessionUser: SessionUser = {
    id: 'user-1',
    nickname: 'tester',
    role: 'user',
    profileCompletedAt: '2026-04-05T00:00:00Z',
    linkedProviders: [],
    isAdmin: false,
  };

  beforeEach(() => {
    window.history.pushState({ tab: 'course' }, '', '/?tab=course');
  });

  it('uses browser back before restoring the return view when a map drawer is open over a route preview', () => {
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const setReturnView = vi.fn();

    const navigation = useAppShellNavigation({
      sessionUser: null,
      returnView: {
        tab: 'course',
        myPageTab: 'stamps',
        activeCommentReviewId: null,
        highlightedCommentId: null,
        highlightedReviewId: null,
        placeId: null,
        festivalId: null,
        drawerState: 'closed',
        feedPlaceFilterId: null,
      },
      activeCommentReviewId: null,
      activeTab: 'map',
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
      drawerState: 'partial',
      selectedRoutePreview: routePreview,
      setMyPageTab: vi.fn(),
      setActiveCommentReviewId: vi.fn(),
      setHighlightedCommentId: vi.fn(),
      setHighlightedReviewId: vi.fn(),
      setFeedPlaceFilterId: vi.fn(),
      setSelectedRoutePreview: vi.fn(),
      setReturnView,
      handleCloseReviewComments: vi.fn(),
      goToTab: vi.fn(),
      commitRouteState: vi.fn(),
    });

    navigation.handleNavigateBack();

    expect(historyBack).toHaveBeenCalledTimes(1);
    expect(setReturnView).not.toHaveBeenCalled();
  });

  it('keeps authenticated my-page back navigation inside the app shell', () => {
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const goToTab = vi.fn();
    const setFeedPlaceFilterId = vi.fn();
    const setHighlightedCommentId = vi.fn();
    const setHighlightedReviewId = vi.fn();
    const setReturnView = vi.fn();

    const navigation = useAppShellNavigation({
      sessionUser,
      returnView: null,
      activeCommentReviewId: null,
      activeTab: 'my',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      selectedRoutePreview: null,
      setMyPageTab: vi.fn(),
      setActiveCommentReviewId: vi.fn(),
      setHighlightedCommentId,
      setHighlightedReviewId,
      setFeedPlaceFilterId,
      setSelectedRoutePreview: vi.fn(),
      setReturnView,
      handleCloseReviewComments: vi.fn(),
      goToTab,
      commitRouteState: vi.fn(),
    });

    navigation.handleNavigateBack();

    expect(historyBack).not.toHaveBeenCalled();
    expect(setHighlightedCommentId).toHaveBeenCalledWith(null);
    expect(setHighlightedReviewId).toHaveBeenCalledWith(null);
    expect(setFeedPlaceFilterId).toHaveBeenCalledWith(null);
    expect(setReturnView).toHaveBeenCalledWith(null);
    expect(goToTab).toHaveBeenCalledWith('map', 'replace');
  });
});
