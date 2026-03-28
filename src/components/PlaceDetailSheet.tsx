import { useRef } from 'react';
import { categoryInfo } from '../lib/categories';
import { PlaceBadgeRow } from './place/PlaceBadgeRow';
import { PlaceDetailHeader } from './place/PlaceDetailHeader';
import { PlaceProofCard } from './place/PlaceProofCard';
import { PlaceReviewPreviewList } from './review/PlaceReviewPreviewList';
import { ReviewComposer } from './ReviewComposer';
import type { ApiStatus, DrawerState, Place, Review, ReviewMood, StampLog } from '../types';

interface PlaceDetailSheetProps {
  place: Place | null;
  reviews: Review[];
  isOpen: boolean;
  drawerState: DrawerState;
  loggedIn: boolean;
  visitCount: number;
  latestStamp: StampLog | null;
  todayStamp: StampLog | null;
  hasCreatedReviewToday: boolean;
  stampActionStatus: ApiStatus;
  stampActionMessage: string;
  reviewProofMessage: string;
  reviewError: string | null;
  reviewSubmitting: boolean;
  canCreateReview: boolean;
  onOpenFeedReview: () => void;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onRequestLogin: () => void;
  onClaimStamp: (place: Place) => Promise<void>;
  onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
}

export function PlaceDetailSheet({
  place,
  reviews,
  isOpen,
  drawerState,
  loggedIn,
  visitCount,
  latestStamp,
  todayStamp,
  hasCreatedReviewToday,
  stampActionStatus,
  stampActionMessage,
  reviewProofMessage,
  reviewError,
  reviewSubmitting,
  canCreateReview,
  onOpenFeedReview,
  onClose,
  onExpand,
  onCollapse,
  onRequestLogin,
  onClaimStamp,
  onCreateReview,
}: PlaceDetailSheetProps) {
  const dragStartYRef = useRef<number | null>(null);

  if (!place || !isOpen) {
    return null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) {
      return;
    }

    const delta = event.clientY - dragStartYRef.current;
    dragStartYRef.current = null;

    if (delta > 72) {
      if (drawerState === 'full') {
        onCollapse();
        return;
      }
      onClose();
      return;
    }

    if (delta < -48) {
      onExpand();
    }
  }

  const sheetClassName = `place-drawer place-drawer--${drawerState}`;
  const visitLabel = latestStamp ? latestStamp.visitLabel : '첫 방문 대기';
  const canClaimStamp = loggedIn && !todayStamp;
  const categoryMeta = categoryInfo[place.category];
  const reviewPreview = reviews.slice(0, 2);
  const reviewComposerStatus = !loggedIn ? 'login' : hasCreatedReviewToday ? 'daily-limit' : todayStamp ? 'ready' : 'claim';

  return (
    <section className={sheetClassName} aria-label="장소 상세 시트">
      <button
        type="button"
        className="place-drawer__handle"
        aria-label="시트 높이 조절"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={drawerState === 'partial' ? onExpand : onCollapse}
      >
        <span />
      </button>

      <div className="place-drawer__content">
        <PlaceDetailHeader name={place.name} summary={place.summary} onClose={onClose} />

        {place.imageUrl && (
          <div className="place-drawer__hero">
            <img src={place.imageUrl} alt={place.name} className="place-drawer__hero-image" loading="lazy" decoding="async" />
          </div>
        )}

        <PlaceBadgeRow
          categoryLabel={categoryMeta.name}
          categoryIcon={categoryMeta.icon}
          categoryColor={categoryMeta.color}
          district={place.district}
          visitLabel={visitLabel}
          visitCount={visitCount}
        />

        <PlaceProofCard
          loggedIn={loggedIn}
          todayStampExists={Boolean(todayStamp)}
          canClaimStamp={canClaimStamp}
          stampActionStatus={stampActionStatus}
          stampActionMessage={stampActionMessage}
          onRequestLogin={onRequestLogin}
          onClaimStamp={() => {
            void onClaimStamp(place);
          }}
        />

        <div className="sheet-card route-hint-box">
          <strong>이동 힌트</strong>
          <p>{place.routeHint}</p>
        </div>

        <ReviewComposer
          placeName={place.name}
          loggedIn={loggedIn}
          canSubmit={canCreateReview}
          status={reviewComposerStatus}
          submitting={reviewSubmitting}
          errorMessage={reviewError}
          proofMessage={reviewProofMessage}
          onSubmit={({ body, mood, file }) => {
            if (!todayStamp) {
              return Promise.resolve();
            }
            return onCreateReview({ stampId: todayStamp.id, body, mood, file });
          }}
          onRequestLogin={onRequestLogin}
          onRequestProof={() => {
            if (!loggedIn) {
              onRequestLogin();
              return;
            }
            if (!todayStamp) {
              void onClaimStamp(place);
            }
          }}
        />

        <div className="section-title-row section-title-row--tight">
          <div>
            <p className="eyebrow">PLACE FEED</p>
            <h3>이 장소 피드</h3>
          </div>
          <button type="button" className="secondary-button place-drawer__feed-button" onClick={onOpenFeedReview}>
            피드에서 보기
          </button>
        </div>

        <PlaceReviewPreviewList reviews={reviewPreview} />
      </div>
    </section>
  );
}
