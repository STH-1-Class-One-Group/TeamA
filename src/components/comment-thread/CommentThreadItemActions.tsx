interface CommentThreadItemActionsProps {
  canWriteComment: boolean;
  isMine: boolean;
  editing: boolean;
  isMutating: boolean;
  onReplyToggle: () => void;
  onStartEditing: () => void;
  onDelete: () => void;
  onCancelEditing: () => void;
}

export function CommentThreadItemActions({
  canWriteComment,
  isMine,
  editing,
  isMutating,
  onReplyToggle,
  onStartEditing,
  onDelete,
  onCancelEditing,
}: CommentThreadItemActionsProps) {
  return (
    <div className="comment-thread__actions">
      {canWriteComment && (
        <button type="button" className="comment-thread__reply-toggle" onClick={onReplyToggle}>
          답글 달기
        </button>
      )}
      {isMine && !editing && (
        <>
          <button type="button" className="comment-thread__reply-toggle" onClick={onStartEditing}>
            수정
          </button>
          <button type="button" className="comment-thread__reply-toggle" onClick={onDelete} disabled={isMutating}>
            삭제
          </button>
        </>
      )}
      {isMine && editing && (
        <button type="button" className="comment-thread__reply-toggle" onClick={onCancelEditing}>
          취소
        </button>
      )}
    </div>
  );
}
