import type { RefObject } from 'react';
import type { MyPageResponse } from '../../types';

type MyComment = NonNullable<MyPageResponse>['comments'][number];

interface MyCommentsTabSectionProps {
  comments: MyComment[];
  commentsHasMore: boolean;
  commentsLoadingMore: boolean;
  commentsLoadMoreRef: RefObject<HTMLDivElement | null>;
  onOpenPlace: (placeId: string) => void;
  onOpenComment: (reviewId: string, commentId: string) => void;
}

export function MyCommentsTabSection({
  comments,
  commentsHasMore,
  commentsLoadingMore,
  commentsLoadMoreRef,
  onOpenPlace,
  onOpenComment,
}: MyCommentsTabSectionProps) {
  return (
    <div className="review-stack">
      {comments.map((comment) => (
        <article key={comment.id} className="review-card review-card--comment-log">
          <div className="review-card__top review-card__top--comment-log">
            <div className="review-card__title-block review-card__title-block--comment-log">
              <p className="review-card__label review-card__label--comment-log">내 댓글</p>
              <p className="review-card__body review-card__body--comment-log">{comment.body}</p>
              <p className="review-card__meta-line">{comment.parentId ? '답글 남김' : '댓글 남김'} · {comment.createdAt}</p>
              <button type="button" className="review-card__place-anchor" onClick={() => onOpenPlace(comment.placeId)}>
                <strong>{comment.placeName}</strong>
              </button>
            </div>
          </div>
          <p className="review-card__context-line">피드 원문 · {comment.reviewBody}</p>
          <button type="button" className="review-card__place-link" onClick={() => onOpenComment(comment.reviewId, comment.id)}>
            내 댓글 보기
          </button>
        </article>
      ))}

      {comments.length === 0 && <p className="empty-copy">아직 작성한 댓글이 없어요.</p>}

      {commentsHasMore && (
        <div ref={commentsLoadMoreRef as RefObject<HTMLDivElement>} className="feed-tab__load-sentinel" aria-hidden="true">
          {commentsLoadingMore ? '불러오는 중...' : ''}
        </div>
      )}
    </div>
  );
}
