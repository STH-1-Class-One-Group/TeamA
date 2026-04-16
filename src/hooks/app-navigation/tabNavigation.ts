import type { SnapshotReturnView, UseAppNavigationHelpersParams } from './navigationTypes';

interface TabNavigationParams
  extends Pick<
    UseAppNavigationHelpersParams,
    | 'activeTab'
    | 'activeCommentReviewId'
    | 'highlightedCommentId'
    | 'highlightedReviewId'
    | 'setHighlightedRouteId'
    | 'setReturnView'
    | 'setSelectedRoutePreview'
    | 'commitRouteState'
    | 'goToTab'
  > {
  snapshotReturnView: SnapshotReturnView;
  handleCloseReviewComments: () => void;
}

export function createTabNavigationHelpers({
  activeTab,
  activeCommentReviewId,
  highlightedCommentId,
  highlightedReviewId,
  setHighlightedRouteId,
  setReturnView,
  setSelectedRoutePreview,
  commitRouteState,
  goToTab,
  snapshotReturnView,
  handleCloseReviewComments,
}: TabNavigationParams) {
  function handleOpenRoutePreview(route: UseAppNavigationHelpersParams['setSelectedRoutePreview'] extends (
    route: infer T,
  ) => void
    ? Exclude<T, null>
    : never) {
    if (activeTab !== 'map') {
      setReturnView(snapshotReturnView());
    }
    setSelectedRoutePreview(route);
    handleCloseReviewComments();
    commitRouteState(
      { tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' },
      activeTab === 'map' ? 'replace' : 'push',
      { routePreview: route },
    );
  }

  function handleOpenPlaceWithReturn(placeId: string) {
    if (activeTab !== 'map') {
      const preserveFeedFocus = activeTab !== 'feed';
      setReturnView(
        snapshotReturnView({
          activeCommentReviewId: preserveFeedFocus ? activeCommentReviewId : null,
          highlightedCommentId: preserveFeedFocus ? highlightedCommentId : null,
          highlightedReviewId: preserveFeedFocus ? highlightedReviewId : null,
        }),
      );
    }
    setSelectedRoutePreview(null);
    commitRouteState({ tab: 'map', placeId, festivalId: null, drawerState: 'partial' }, 'push', { routePreview: null });
  }

  function handleOpenFestivalWithReturn(festivalId: string) {
    if (activeTab !== 'map') {
      setReturnView(snapshotReturnView());
    }
    setSelectedRoutePreview(null);
    commitRouteState({ tab: 'map', placeId: null, festivalId, drawerState: 'partial' }, 'push', { routePreview: null });
  }

  function handleOpenCommunityRouteWithReturn(routeId: string) {
    if (activeTab !== 'course') {
      setReturnView(snapshotReturnView());
    }
    setHighlightedRouteId(routeId);
    setSelectedRoutePreview(null);
    handleCloseReviewComments();
    goToTab('course');
  }

  return {
    handleOpenRoutePreview,
    handleOpenPlaceWithReturn,
    handleOpenFestivalWithReturn,
    handleOpenCommunityRouteWithReturn,
  };
}
