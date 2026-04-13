import { useAppReviewCommentActions } from './useAppReviewCommentActions';
import { useAppReviewCrudActions } from './useAppReviewCrudActions';
import { useAppReviewLikeActions } from './useAppReviewLikeActions';
import type { UseAppReviewActionsParams } from './useAppReviewActions.types';

export function useAppReviewActions(params: UseAppReviewActionsParams) {
  const reviewCrudActions = useAppReviewCrudActions(params);
  const commentActions = useAppReviewCommentActions(params);
  const reviewLikeActions = useAppReviewLikeActions(params);

  return {
    ...reviewCrudActions,
    ...commentActions,
    ...reviewLikeActions,
  };
}
