import { memo, useState } from 'react';
import type { CommentComposerProps } from './types';

export const CommentComposer = memo(function CommentComposer({
  canWriteComment,
  placeholder,
  reviewId,
  submittingReviewId,
  onRequestLogin,
  onSubmitComment,
  parentId,
  onSubmitted,
}: CommentComposerProps) {
  const [body, setBody] = useState('');
  const isSubmitting = submittingReviewId === reviewId;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteComment) {
      onRequestLogin();
      return;
    }

    const trimmedBody = body.trim();
    if (trimmedBody.length < 2) {
      return;
    }

    await onSubmitComment(reviewId, trimmedBody, parentId);
    setBody('');
    onSubmitted?.();
  }

  return (
    <form className="comment-thread__reply-form" onSubmit={handleSubmit}>
      <input value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} />
      <button type="submit" className="comment-thread__submit" disabled={isSubmitting || body.trim().length < 2}>
        {isSubmitting ? '등록 중' : '등록'}
      </button>
    </form>
  );
});
