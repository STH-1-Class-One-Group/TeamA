import { FeedTab } from '../FeedTab';
import type { AppPageStageProps } from '../AppPageStage';

type PageStageFeedViewProps = Pick<AppPageStageProps, 'sharedData' | 'feedData' | 'sharedActions' | 'feedActions'>;

export function PageStageFeedView({
  sharedData,
  feedData,
  sharedActions,
  feedActions,
}: PageStageFeedViewProps) {
  return (
    <FeedTab
      feedData={{
        reviews: feedData.reviews,
        placeFilterId: feedData.feedPlaceFilterId,
        placeFilterName: feedData.feedPlaceFilterId ? sharedData.placeNameById[feedData.feedPlaceFilterId] ?? null : null,
        highlightedReviewId: feedData.highlightedReviewId,
        reviewLikeUpdatingId: feedData.reviewLikeUpdatingId,
        hasMore: feedData.feedHasMore && !feedData.feedPlaceFilterId,
        loadingMore: feedData.feedLoadingMore,
      }}
      commentSheetData={{
        activeCommentReviewId: feedData.activeCommentReviewId,
        activeCommentReviewComments: feedData.activeCommentReviewComments,
        activeCommentReviewStatus: feedData.activeCommentReviewStatus,
        highlightedCommentId: feedData.highlightedCommentId,
        commentSubmittingReviewId: feedData.commentSubmittingReviewId,
        commentMutatingId: feedData.commentMutatingId,
        deletingReviewId: feedData.deletingReviewId,
      }}
      sharedData={{
        sessionUser: sharedData.sessionUser,
      }}
      feedActions={{
        onLoadMore: feedActions.onLoadMoreFeed,
        onToggleReviewLike: feedActions.onToggleReviewLike,
        onCreateComment: feedActions.onCreateComment,
        onUpdateComment: feedActions.onUpdateComment,
        onDeleteComment: feedActions.onDeleteComment,
        onDeleteReview: feedActions.onDeleteReview,
        onClearPlaceFilter: feedActions.onClearPlaceFilter,
        onOpenComments: feedActions.onOpenComments,
        onCloseComments: feedActions.onCloseComments,
      }}
      sharedActions={{
        onRequestLogin: sharedActions.onRequestLogin,
        onOpenPlace: sharedActions.onOpenPlace,
      }}
    />
  );
}
