import { CommentComposer } from './comment-thread/CommentComposer';
import { CommentThreadItem } from './comment-thread/CommentThreadItem';
import type { CommentThreadProps } from './comment-thread/types';

export function CommentThread({
  comments,
  canWriteComment,
  currentUserId = null,
  submittingReviewId,
  mutatingCommentId,
  highlightedCommentId,
  reviewId,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onRequestLogin,
}: CommentThreadProps) {
  return (
    <div className="comment-thread">
      <CommentComposer
        key={reviewId}
        canWriteComment={canWriteComment}
        placeholder="댓글 내용을 적어 보세요."
        reviewId={reviewId}
        submittingReviewId={submittingReviewId}
        onRequestLogin={onRequestLogin}
        onSubmitComment={onSubmitComment}
      />

      {comments.length > 0 && (
        <ul className="comment-thread__list">
          {comments.map((comment) => (
            <CommentThreadItem
              key={comment.id}
              comment={comment}
              reviewId={reviewId}
              canWriteComment={canWriteComment}
              currentUserId={currentUserId}
              submittingReviewId={submittingReviewId}
              mutatingCommentId={mutatingCommentId}
              highlightedCommentId={highlightedCommentId}
              onSubmitComment={onSubmitComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onRequestLogin={onRequestLogin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
