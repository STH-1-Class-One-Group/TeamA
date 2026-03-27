import { useState } from 'react';
import { ReviewFormFields } from './ReviewFormFields';
import type { ReviewMood } from '../types';

type ReviewComposerStatus = 'login' | 'claim' | 'ready' | 'daily-limit';

interface ReviewComposerProps {
  placeName: string;
  loggedIn: boolean;
  canSubmit: boolean;
  status: ReviewComposerStatus;
  submitting: boolean;
  errorMessage: string | null;
  proofMessage: string;
  onSubmit: (payload: { body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
  onRequestLogin: () => void;
  onRequestProof: () => void;
}

const moodOptions: ReviewMood[] = ['혼자서', '친구랑', '데이트', '야경 맛집'];

export function ReviewComposer({
  placeName,
  loggedIn,
  canSubmit,
  status,
  submitting,
  errorMessage,
  proofMessage,
  onSubmit,
  onRequestLogin,
  onRequestProof,
}: ReviewComposerProps) {
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<ReviewMood>('혼자서');
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || body.trim().length < 4) {
      return;
    }

    await onSubmit({ body: body.trim(), mood, file });
    setBody('');
    setFile(null);
    setMood('혼자서');
  }

  const fieldsDisabled = status !== 'ready' || submitting;
  const isDailyLimitReached = status === 'daily-limit';
  const actionLabel = !loggedIn
    ? '로그인하고 작성'
    : isDailyLimitReached
      ? '오늘 피드 작성 완료'
      : canSubmit
        ? '피드 올리기'
        : '오늘 스탬프 먼저 찍기';
  const actionHandler = !loggedIn ? onRequestLogin : canSubmit || isDailyLimitReached ? undefined : onRequestProof;

  return (
    <section className="sheet-card stack-gap review-composer">
      <div>
        <p className="eyebrow">WRITE FEED</p>
        <h3>{placeName} 피드 남기기</h3>
        <p className="section-copy">{proofMessage}</p>
      </div>

      <form className="route-builder-form" onSubmit={handleSubmit}>
        <ReviewFormFields
          moodOptions={moodOptions}
          mood={mood}
          onMoodChange={setMood}
          body={body}
          onBodyChange={setBody}
          file={file}
          onFileChange={setFile}
          disabled={fieldsDisabled}
        />

        {errorMessage && <p className="form-error-copy">{errorMessage}</p>}

        {actionHandler ? (
          <button type="button" className="primary-button route-submit-button" onClick={actionHandler}>
            {actionLabel}
          </button>
        ) : (
          <button
            type="submit"
            className="primary-button route-submit-button"
            disabled={submitting || body.trim().length < 4 || isDailyLimitReached}
          >
            {submitting ? '올리는 중' : actionLabel}
          </button>
        )}
      </form>
    </section>
  );
}
