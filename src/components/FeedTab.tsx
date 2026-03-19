import { useState } from 'react';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { FeedCommentSheet } from './FeedCommentSheet';
import { ReviewList } from './ReviewList';
import type { Review, SessionUser } from '../types';

interface FeedTabProps {
  reviews: Review[];
  sessionUser: SessionUser | null;
  reviewLikeUpdatingId: string | null;
  commentSubmittingReviewId: string | null;
  onToggleReviewLike: (reviewId: string) => Promise<void>;
  onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onRequestLogin: () => void;
  onOpenPlace: (placeId: string) => void;
}

export function FeedTab({
  reviews,
  sessionUser,
  reviewLikeUpdatingId,
  commentSubmittingReviewId,
  onToggleReviewLike,
  onCreateComment,
  onRequestLogin,
  onOpenPlace,
}: FeedTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>('feed');
  const [activeCommentReviewId, setActiveCommentReviewId] = useState<string | null>(null);

  const activeReview = reviews.find((r) => r.id === activeCommentReviewId) ?? null;

  return (
    <>
      <section ref={scrollRef} className="page-panel page-panel--scrollable">
        <header className="panel-header">
          <p className="eyebrow">FEED</p>
          <h2>방문 피드</h2>
          <p>스탬프를 찍은 뒤에만 남길 수 있는 실제 방문 후기만 모아 보여줍니다.</p>
        </header>
        <ReviewList
          reviews={reviews}
          canWriteComment={Boolean(sessionUser)}
          canToggleLike={Boolean(sessionUser)}
          likingReviewId={reviewLikeUpdatingId}
          submittingReviewId={commentSubmittingReviewId}
          onToggleLike={onToggleReviewLike}
          onSubmitComment={onCreateComment}
          onRequestLogin={onRequestLogin}
          onOpenPlace={onOpenPlace}
          onOpenComments={(reviewId) => setActiveCommentReviewId(reviewId)}
          emptyTitle="아직 공개된 피드가 없어요"
          emptyBody="먼저 스탬프를 찍고 오늘의 분위기를 짧게 남겨 보세요."
        />
      </section>
      <FeedCommentSheet
        review={activeReview}
        isOpen={activeCommentReviewId !== null}
        canWriteComment={Boolean(sessionUser)}
        submittingReviewId={commentSubmittingReviewId}
        onClose={() => setActiveCommentReviewId(null)}
        onSubmitComment={onCreateComment}
        onRequestLogin={onRequestLogin}
      />
    </>
  );
}
