import { createReviewNavigationHelpers } from './app-navigation/reviewNavigation';
import { createReturnViewSnapshot } from './app-navigation/returnView';
import { createTabNavigationHelpers } from './app-navigation/tabNavigation';
import type { UseAppNavigationHelpersParams } from './app-navigation/navigationTypes';

export function useAppNavigationHelpers({
  activeTab,
  myPageTab,
  activeCommentReviewId,
  highlightedCommentId,
  highlightedReviewId,
  selectedPlaceId,
  selectedFestivalId,
  drawerState,
  feedPlaceFilterId,
  reviews,
  selectedPlaceReviews,
  myPageReviews,
  setActiveCommentReviewId,
  setHighlightedCommentId,
  setHighlightedReviewId,
  setHighlightedRouteId,
  setReturnView,
  setSelectedRoutePreview,
  setFeedPlaceFilterId,
  setNotice,
  goToTab,
  commitRouteState,
  upsertReviewCollections,
}: UseAppNavigationHelpersParams) {
  const snapshotReturnView = createReturnViewSnapshot({
    activeTab,
    myPageTab,
    activeCommentReviewId,
    highlightedCommentId,
    highlightedReviewId,
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    feedPlaceFilterId,
  });

  const reviewNavigation = createReviewNavigationHelpers({
    activeTab,
    reviews,
    selectedPlaceReviews,
    myPageReviews,
    goToTab,
    setActiveCommentReviewId,
    setHighlightedCommentId,
    setHighlightedReviewId,
    setFeedPlaceFilterId,
    setReturnView,
    setNotice,
    upsertReviewCollections,
    snapshotReturnView,
  });

  const tabNavigation = createTabNavigationHelpers({
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
    handleCloseReviewComments: reviewNavigation.handleCloseReviewComments,
  });

  return {
    ...reviewNavigation,
    ...tabNavigation,
  };
}
