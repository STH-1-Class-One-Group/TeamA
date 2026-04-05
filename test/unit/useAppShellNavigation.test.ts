import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppShellNavigation } from '../../src/hooks/useAppShellNavigation';
import type { RoutePreview } from '../../src/types';

const routePreview: RoutePreview = {
  id: 'route-1',
  title: '빵집 산책 코스',
  subtitle: 'tester / 04. 05. 12:00',
  mood: '데이트',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['첫 번째 장소', '두 번째 장소'],
};

describe('useAppShellNavigation', () => {
  beforeEach(() => {
    window.history.pushState({ tab: 'course' }, '', '/?tab=course');
  });

  it('uses browser back before restoring the return view when a map drawer is open over a route preview', () => {
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const setReturnView = vi.fn();

    const navigation = useAppShellNavigation({
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
});
