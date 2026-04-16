import { memo } from 'react';
import { CommentComposer } from './CommentComposer';
import { CommentThreadItemActions } from './CommentThreadItemActions';
import type { CommentItemProps } from './types';
import { useCommentThreadItemState } from './useCommentThreadItemState';

export const CommentThreadItem = memo(function CommentThreadItem({
  comment,
  reviewId,
  canWriteComment,
  currentUserId,
  submittingReviewId,
  mutatingCommentId,
  highlightedCommentId,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onRequestLogin,
  isReply = false,
}: CommentItemProps) {
  const isMine = currentUserId === comment.userId;
  const isMutating = mutatingCommentId === comment.id;
  const isHighlighted = highlightedCommentId === comment.id;
  const {
    itemRef,
    replyOpen,
    setReplyOpen,
    editing,
    setEditing,
    editingBody,
    setEditingBody,
  } = useCommentThreadItemState(comment.body, isHighlighted);

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = editingBody.trim();
    if (trimmedBody.length < 2) {
      return;
    }

    await onUpdateComment(reviewId, comment.id, trimmedBody);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm('정말 댓글을 삭제할까요?')) {
      return;
    }

    await onDeleteComment(reviewId, comment.id);
  }

  function handleReplyToggle() {
    if (!canWriteComment) {
      onRequestLogin();
      return;
    }

    setReplyOpen((current) => !current);
  }

  return (
    <li ref={itemRef} className={isReply ? 'comment-thread__item comment-thread__item--reply' : 'comment-thread__item'}>
      {isReply && (
        <span className="comment-thread__reply-indent" aria-hidden="true">
          ↳
        </span>
      )}

      <div className="comment-thread__main">
        <div className={isHighlighted ? 'comment-thread__bubble is-highlighted' : 'comment-thread__bubble'}>
          <div className="comment-thread__meta">
            <strong>{comment.author}</strong>
            <span>{comment.createdAt}</span>
          </div>

          {editing && !comment.isDeleted ? (
            <form className="comment-thread__reply-form" onSubmit={handleEditSubmit}>
              <input
                value={editingBody}
                onChange={(event) => setEditingBody(event.target.value)}
                placeholder="댓글 내용을 수정해 보세요."
              />
              <button type="submit" className="comment-thread__submit" disabled={isMutating || editingBody.trim().length < 2}>
                {isMutating ? '수정 중' : '수정'}
              </button>
            </form>
          ) : (
            <p>{comment.isDeleted ? '삭제된 댓글입니다.' : comment.body}</p>
          )}

          {!comment.isDeleted && (
            <CommentThreadItemActions
              canWriteComment={canWriteComment}
              isMine={isMine}
              editing={editing}
              isMutating={isMutating}
              onReplyToggle={handleReplyToggle}
              onStartEditing={() => setEditing(true)}
              onDelete={() => void handleDelete()}
              onCancelEditing={() => {
                setEditing(false);
                setEditingBody(comment.body);
              }}
            />
          )}
        </div>

        {!isReply && replyOpen && (
          <CommentComposer
            canWriteComment={canWriteComment}
            placeholder="답글 내용을 적어 보세요."
            reviewId={reviewId}
            submittingReviewId={submittingReviewId}
            onRequestLogin={onRequestLogin}
            onSubmitComment={onSubmitComment}
            parentId={comment.id}
            onSubmitted={() => setReplyOpen(false)}
          />
        )}

        {!isReply && comment.replies.length > 0 && (
          <ul className="comment-thread__children">
            {comment.replies.map((reply) => (
              <CommentThreadItem
                key={reply.id}
                comment={reply}
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
                isReply={true}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
});
