import type { ReturnViewState } from '../../store/app-ui-store';
import type { SnapshotReturnView, UseAppNavigationHelpersParams } from './navigationTypes';

type ReturnViewContext = Pick<
  UseAppNavigationHelpersParams,
  | 'activeTab'
  | 'myPageTab'
  | 'activeCommentReviewId'
  | 'highlightedCommentId'
  | 'highlightedReviewId'
  | 'selectedPlaceId'
  | 'selectedFestivalId'
  | 'drawerState'
  | 'feedPlaceFilterId'
>;

function createReturnView(params: ReturnViewState): ReturnViewState {
  return params;
}

export function createReturnViewSnapshot({
  activeTab,
  myPageTab,
  activeCommentReviewId,
  highlightedCommentId,
  highlightedReviewId,
  selectedPlaceId,
  selectedFestivalId,
  drawerState,
  feedPlaceFilterId,
}: ReturnViewContext): SnapshotReturnView {
  return (overrides = {}) =>
    createReturnView({
      tab: activeTab,
      myPageTab,
      activeCommentReviewId,
      highlightedCommentId,
      highlightedReviewId,
      placeId: selectedPlaceId,
      festivalId: selectedFestivalId,
      drawerState,
      feedPlaceFilterId,
      ...overrides,
    });
}
