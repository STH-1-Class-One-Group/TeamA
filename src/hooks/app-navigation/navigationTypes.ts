import type { ReturnViewState } from '../../store/app-ui-store';
import type {
  DrawerState,
  MyPageTabKey,
  Review,
  RoutePreview,
  Tab,
} from '../../types';
import type { RouteStateCommitOptions } from '../useAppRouteState';

export interface UseAppNavigationHelpersParams {
  activeTab: Tab;
  myPageTab: MyPageTabKey;
  activeCommentReviewId: string | null;
  highlightedCommentId: string | null;
  highlightedReviewId: string | null;
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  drawerState: DrawerState;
  feedPlaceFilterId: string | null;
  reviews: Review[];
  selectedPlaceReviews: Review[];
  myPageReviews: Review[];
  setActiveCommentReviewId: (reviewId: string | null) => void;
  setHighlightedCommentId: (commentId: string | null) => void;
  setHighlightedReviewId: (reviewId: string | null) => void;
  setHighlightedRouteId: (routeId: string | null) => void;
  setReturnView: (value: ReturnViewState | null) => void;
  setSelectedRoutePreview: (route: RoutePreview | null) => void;
  setFeedPlaceFilterId: (placeId: string | null) => void;
  setNotice: (message: string) => void;
  goToTab: (tab: Tab, historyMode?: 'push' | 'replace') => void;
  commitRouteState: (
    nextState: { tab: Tab; placeId: string | null; festivalId: string | null; drawerState: DrawerState },
    historyMode?: 'push' | 'replace',
    options?: RouteStateCommitOptions,
  ) => void;
  upsertReviewCollections: (review: Review) => void;
}

export type SnapshotReturnView = (overrides?: Partial<ReturnViewState>) => ReturnViewState;

export function formatNavigationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '요청을 처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
}
