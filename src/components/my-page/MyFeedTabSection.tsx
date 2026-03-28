import { useState } from 'react';
import { ReviewFormFields } from '../ReviewFormFields';
import { ReviewFeedCardHeader } from '../review/ReviewFeedCardHeader';
import { ReviewTagRow } from '../review/ReviewTagRow';
import type { MyPageResponse, ReviewMood } from '../../types';

const reviewMoodOptions: ReviewMood[] = ['혼자서', '친구랑', '데이트', '야경 맛집'];

type MyReview = NonNullable<MyPageResponse>['reviews'][number];

interface MyFeedTabSectionProps {
  reviews: MyReview[];
  onOpenPlace: (placeId: string) => void;
  onOpenReview: (reviewId: string) => void;
  onUpdateReview: (reviewId: string, payload: { body: string; mood: ReviewMood; file?: File | null; removeImage?: boolean }) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

export function MyFeedTabSection({
  reviews,
  onOpenPlace,
  onOpenReview,
  onUpdateReview,
  onDeleteReview,
}: MyFeedTabSectionProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewBody, setEditingReviewBody] = useState('');
  const [editingReviewMood, setEditingReviewMood] = useState<ReviewMood>('혼자서');
  const [editingReviewFile, setEditingReviewFile] = useState<File | null>(null);
  const [editingReviewRemoveImage, setEditingReviewRemoveImage] = useState(false);
  const [reviewUpdatingId, setReviewUpdatingId] = useState<string | null>(null);
  const [reviewEditError, setReviewEditError] = useState<string | null>(null);

  function startEditingReview(review: MyReview) {
    setEditingReviewId(review.id);
    setEditingReviewBody(review.body);
    setEditingReviewMood(review.mood);
    setEditingReviewFile(null);
    setEditingReviewRemoveImage(false);
    setReviewEditError(null);
  }

  function cancelEditingReview() {
    setEditingReviewId(null);
    setEditingReviewBody('');
    setEditingReviewMood('혼자서');
    setEditingReviewFile(null);
    setEditingReviewRemoveImage(false);
    setReviewEditError(null);
  }

  async function handleSaveReview(reviewId: string) {
    try {
      setReviewUpdatingId(reviewId);
      setReviewEditError(null);
      await onUpdateReview(reviewId, {
        body: editingReviewBody.trim(),
        mood: editingReviewMood,
        file: editingReviewFile,
        removeImage: editingReviewRemoveImage,
      });
      cancelEditingReview();
    } catch (error) {
      setReviewEditError(error instanceof Error ? error.message : '피드를 수정하지 못했어요.');
    } finally {
      setReviewUpdatingId(null);
    }
  }

  return (
    <div className="review-stack">
      {reviews.map((review) => (
        <article key={review.id} className="review-card review-card--my-feed">
          <ReviewFeedCardHeader
            title={
              <button type="button" className="review-card__place-anchor" onClick={() => onOpenPlace(review.placeId)}>
                <strong className="review-card__title">{review.placeName}</strong>
              </button>
            }
            mood={review.mood}
            meta={review.visitedAt}
          />
          <ReviewTagRow visitLabel={review.visitLabel} badge={review.badge} hasPublishedRoute={review.hasPublishedRoute} />
          {editingReviewId === review.id ? (
            <div className="route-builder-form review-edit-form">
              <ReviewFormFields
                moodOptions={reviewMoodOptions}
                mood={editingReviewMood}
                onMoodChange={setEditingReviewMood}
                body={editingReviewBody}
                onBodyChange={setEditingReviewBody}
                file={editingReviewFile}
                onFileChange={(nextFile) => {
                  setEditingReviewFile(nextFile);
                  if (nextFile) {
                    setEditingReviewRemoveImage(false);
                  }
                }}
                disabled={reviewUpdatingId === review.id}
                bodyLabel="피드 내용"
                fileLabel="피드 이미지"
                existingImageUrl={review.imageUrl}
                existingImageAlt={`${review.placeName} 기존 피드 이미지`}
                removeImage={editingReviewRemoveImage}
                onToggleRemoveImage={review.imageUrl ? (() => {
                  setEditingReviewRemoveImage((current) => !current);
                  setEditingReviewFile(null);
                }) : undefined}
              />
              {reviewEditError ? <p className="form-error-copy">{reviewEditError}</p> : null}
              <div className="review-card__actions review-card__actions--my-feed">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEditingReview}
                  disabled={reviewUpdatingId === review.id}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={reviewUpdatingId === review.id || editingReviewBody.trim().length < 4}
                  onClick={() => void handleSaveReview(review.id)}
                >
                  {reviewUpdatingId === review.id ? '저장 중' : '수정 저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="review-card__body">{review.body}</p>
              <div className="review-card__actions review-card__actions--my-feed">
                <button type="button" className="review-card__place-link" onClick={() => onOpenReview(review.id)}>내 피드 보기</button>
                <button type="button" className="review-card__place-link" onClick={() => startEditingReview(review)}>수정</button>
                <button type="button" className="review-card__place-link review-card__place-link--danger" onClick={() => void onDeleteReview(review.id)}>삭제</button>
              </div>
            </>
          )}
        </article>
      ))}
      {reviews.length === 0 && <p className="empty-copy">아직 작성한 피드가 없어요.</p>}
    </div>
  );
}
