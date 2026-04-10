import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';

export function useAppPageRuntimeState() {
  const reviewSubmitting = useAppPageRuntimeStore((state) => state.reviewSubmitting);
  const reviewError = useAppPageRuntimeStore((state) => state.reviewError);
  const reviewLikeUpdatingId = useAppPageRuntimeStore((state) => state.reviewLikeUpdatingId);
  const commentSubmittingReviewId = useAppPageRuntimeStore((state) => state.commentSubmittingReviewId);
  const commentMutatingId = useAppPageRuntimeStore((state) => state.commentMutatingId);
  const deletingReviewId = useAppPageRuntimeStore((state) => state.deletingReviewId);
  const routeSubmitting = useAppPageRuntimeStore((state) => state.routeSubmitting);
  const setRouteSubmitting = useAppPageRuntimeStore((state) => state.setRouteSubmitting);
  const routeError = useAppPageRuntimeStore((state) => state.routeError);
  const setRouteError = useAppPageRuntimeStore((state) => state.setRouteError);
  const routeLikeUpdatingId = useAppPageRuntimeStore((state) => state.routeLikeUpdatingId);
  const setRouteLikeUpdatingId = useAppPageRuntimeStore((state) => state.setRouteLikeUpdatingId);
  const profileSaving = useAppPageRuntimeStore((state) => state.profileSaving);
  const setProfileSaving = useAppPageRuntimeStore((state) => state.setProfileSaving);
  const profileError = useAppPageRuntimeStore((state) => state.profileError);
  const setProfileError = useAppPageRuntimeStore((state) => state.setProfileError);
  const myPageError = useAppPageRuntimeStore((state) => state.myPageError);
  const setMyPageError = useAppPageRuntimeStore((state) => state.setMyPageError);
  const isLoggingOut = useAppPageRuntimeStore((state) => state.isLoggingOut);
  const setIsLoggingOut = useAppPageRuntimeStore((state) => state.setIsLoggingOut);
  const feedHasMore = useAppPageRuntimeStore((state) => state.feedHasMore);
  const feedLoadingMore = useAppPageRuntimeStore((state) => state.feedLoadingMore);
  const myCommentsHasMore = useAppPageRuntimeStore((state) => state.myCommentsHasMore);
  const myCommentsLoadingMore = useAppPageRuntimeStore((state) => state.myCommentsLoadingMore);
  const myCommentsLoadedOnce = useAppPageRuntimeStore((state) => state.myCommentsLoadedOnce);

  return {
    reviewSubmitting,
    reviewError,
    reviewLikeUpdatingId,
    commentSubmittingReviewId,
    commentMutatingId,
    deletingReviewId,
    routeSubmitting,
    setRouteSubmitting,
    routeError,
    setRouteError,
    routeLikeUpdatingId,
    setRouteLikeUpdatingId,
    profileSaving,
    setProfileSaving,
    profileError,
    setProfileError,
    myPageError,
    setMyPageError,
    isLoggingOut,
    setIsLoggingOut,
    feedHasMore,
    feedLoadingMore,
    myCommentsHasMore,
    myCommentsLoadingMore,
    myCommentsLoadedOnce,
  };
}
