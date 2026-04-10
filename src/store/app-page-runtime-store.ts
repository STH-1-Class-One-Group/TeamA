import { create } from 'zustand';
import { resolveValue, type SetterValue } from './store-utils';

type AppPageRuntimeState = {
  reviewSubmitting: boolean;
  reviewError: string | null;
  reviewLikeUpdatingId: string | null;
  commentSubmittingReviewId: string | null;
  commentMutatingId: string | null;
  deletingReviewId: string | null;
  routeSubmitting: boolean;
  routeError: string | null;
  routeLikeUpdatingId: string | null;
  profileSaving: boolean;
  profileError: string | null;
  myPageError: string | null;
  isLoggingOut: boolean;
  feedNextCursor: string | null;
  feedHasMore: boolean;
  feedLoadingMore: boolean;
  myCommentsNextCursor: string | null;
  myCommentsHasMore: boolean;
  myCommentsLoadingMore: boolean;
  myCommentsLoadedOnce: boolean;
  setReviewSubmitting: (value: SetterValue<boolean>) => void;
  setReviewError: (value: SetterValue<string | null>) => void;
  setReviewLikeUpdatingId: (value: SetterValue<string | null>) => void;
  setCommentSubmittingReviewId: (value: SetterValue<string | null>) => void;
  setCommentMutatingId: (value: SetterValue<string | null>) => void;
  setDeletingReviewId: (value: SetterValue<string | null>) => void;
  setRouteSubmitting: (value: SetterValue<boolean>) => void;
  setRouteError: (value: SetterValue<string | null>) => void;
  setRouteLikeUpdatingId: (value: SetterValue<string | null>) => void;
  setProfileSaving: (value: SetterValue<boolean>) => void;
  setProfileError: (value: SetterValue<string | null>) => void;
  setMyPageError: (value: SetterValue<string | null>) => void;
  setIsLoggingOut: (value: SetterValue<boolean>) => void;
  setFeedNextCursor: (value: SetterValue<string | null>) => void;
  setFeedHasMore: (value: SetterValue<boolean>) => void;
  setFeedLoadingMore: (value: SetterValue<boolean>) => void;
  setMyCommentsNextCursor: (value: SetterValue<string | null>) => void;
  setMyCommentsHasMore: (value: SetterValue<boolean>) => void;
  setMyCommentsLoadingMore: (value: SetterValue<boolean>) => void;
  setMyCommentsLoadedOnce: (value: SetterValue<boolean>) => void;
};

export const useAppPageRuntimeStore = create<AppPageRuntimeState>((set) => ({
  reviewSubmitting: false,
  reviewError: null,
  reviewLikeUpdatingId: null,
  commentSubmittingReviewId: null,
  commentMutatingId: null,
  deletingReviewId: null,
  routeSubmitting: false,
  routeError: null,
  routeLikeUpdatingId: null,
  profileSaving: false,
  profileError: null,
  myPageError: null,
  isLoggingOut: false,
  feedNextCursor: null,
  feedHasMore: false,
  feedLoadingMore: false,
  myCommentsNextCursor: null,
  myCommentsHasMore: false,
  myCommentsLoadingMore: false,
  myCommentsLoadedOnce: false,
  setReviewSubmitting: (value) => set((state) => ({ reviewSubmitting: resolveValue(value, state.reviewSubmitting) })),
  setReviewError: (value) => set((state) => ({ reviewError: resolveValue(value, state.reviewError) })),
  setReviewLikeUpdatingId: (value) => set((state) => ({ reviewLikeUpdatingId: resolveValue(value, state.reviewLikeUpdatingId) })),
  setCommentSubmittingReviewId: (value) => set((state) => ({ commentSubmittingReviewId: resolveValue(value, state.commentSubmittingReviewId) })),
  setCommentMutatingId: (value) => set((state) => ({ commentMutatingId: resolveValue(value, state.commentMutatingId) })),
  setDeletingReviewId: (value) => set((state) => ({ deletingReviewId: resolveValue(value, state.deletingReviewId) })),
  setRouteSubmitting: (value) => set((state) => ({ routeSubmitting: resolveValue(value, state.routeSubmitting) })),
  setRouteError: (value) => set((state) => ({ routeError: resolveValue(value, state.routeError) })),
  setRouteLikeUpdatingId: (value) => set((state) => ({ routeLikeUpdatingId: resolveValue(value, state.routeLikeUpdatingId) })),
  setProfileSaving: (value) => set((state) => ({ profileSaving: resolveValue(value, state.profileSaving) })),
  setProfileError: (value) => set((state) => ({ profileError: resolveValue(value, state.profileError) })),
  setMyPageError: (value) => set((state) => ({ myPageError: resolveValue(value, state.myPageError) })),
  setIsLoggingOut: (value) => set((state) => ({ isLoggingOut: resolveValue(value, state.isLoggingOut) })),
  setFeedNextCursor: (value) => set((state) => ({ feedNextCursor: resolveValue(value, state.feedNextCursor) })),
  setFeedHasMore: (value) => set((state) => ({ feedHasMore: resolveValue(value, state.feedHasMore) })),
  setFeedLoadingMore: (value) => set((state) => ({ feedLoadingMore: resolveValue(value, state.feedLoadingMore) })),
  setMyCommentsNextCursor: (value) => set((state) => ({ myCommentsNextCursor: resolveValue(value, state.myCommentsNextCursor) })),
  setMyCommentsHasMore: (value) => set((state) => ({ myCommentsHasMore: resolveValue(value, state.myCommentsHasMore) })),
  setMyCommentsLoadingMore: (value) => set((state) => ({ myCommentsLoadingMore: resolveValue(value, state.myCommentsLoadingMore) })),
  setMyCommentsLoadedOnce: (value) => set((state) => ({ myCommentsLoadedOnce: resolveValue(value, state.myCommentsLoadedOnce) })),
}));
