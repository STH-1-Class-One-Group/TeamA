import { describe, expect, it, vi } from 'vitest';
import { useAppNavigationHelpers } from '../../src/hooks/useAppNavigationHelpers';
import type { RoutePreview } from '../../src/types';

const routePreview: RoutePreview = {
  id: 'route-1',
  title: '빵집 산책 코스',
  subtitle: 'tester / 04. 05. 12:00',
  mood: '데이트',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['첫 번째 장소', '두 번째 장소'],
};

describe('useAppNavigationHelpers', () => {
  it('pushes map state with route preview metadata when opening preview from the course tab', () => {
    const setReturnView = vi.fn();
    const setSelectedRoutePreview = vi.fn();
    const setActiveCommentReviewId = vi.fn();
    const setHighlightedCommentId = vi.fn();
    const setHighlightedReviewId = vi.fn();
    const setFeedPlaceFilterId = vi.fn();
    const setNotice = vi.fn();
    const goToTab = vi.fn();
    const commitRouteState = vi.fn();

    const helpers = useAppNavigationHelpers({
      activeTab: 'course',
      myPageTab: 'stamps',
      activeCommentReviewId: null,
      highlightedCommentId: null,
      highlightedReviewId: null,
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      feedPlaceFilterId: null,
      reviews: [],
      selectedPlaceReviews: [],
      myPageReviews: [],
      setActiveCommentReviewId,
      setHighlightedCommentId,
      setHighlightedReviewId,
      setReturnView,
      setSelectedRoutePreview,
      setFeedPlaceFilterId,
      setNotice,
      goToTab,
      commitRouteState,
      openPlace: vi.fn(),
      openFestival: vi.fn(),
      upsertReviewCollections: vi.fn(),
    });

    helpers.handleOpenRoutePreview(routePreview);

    expect(setReturnView).toHaveBeenCalledWith(expect.objectContaining({ tab: 'course', drawerState: 'closed' }));
    expect(setSelectedRoutePreview).toHaveBeenCalledWith(routePreview);
    expect(setActiveCommentReviewId).toHaveBeenCalledWith(null);
    expect(setHighlightedCommentId).toHaveBeenCalledWith(null);
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' },
      'push',
      { routePreview },
    );
    expect(goToTab).not.toHaveBeenCalled();
    expect(setFeedPlaceFilterId).not.toHaveBeenCalled();
    expect(setNotice).not.toHaveBeenCalled();
    expect(setHighlightedReviewId).not.toHaveBeenCalled();
  });
});
