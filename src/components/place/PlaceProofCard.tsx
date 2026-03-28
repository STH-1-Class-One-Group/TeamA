import type { ApiStatus } from '../../types';

interface PlaceProofCardProps {
  loggedIn: boolean;
  todayStampExists: boolean;
  canClaimStamp: boolean;
  stampActionStatus: ApiStatus;
  stampActionMessage: string;
  onRequestLogin: () => void;
  onClaimStamp: () => void;
}

export function PlaceProofCard({
  loggedIn,
  todayStampExists,
  canClaimStamp,
  stampActionStatus,
  stampActionMessage,
  onRequestLogin,
  onClaimStamp,
}: PlaceProofCardProps) {
  const buttonClassName = todayStampExists
    ? 'secondary-button is-complete place-drawer__proof-button'
    : 'primary-button place-drawer__proof-button';
  const buttonLabel = todayStampExists
    ? '오늘 스탬프 완료'
    : stampActionStatus === 'loading'
      ? '확인 중'
      : '오늘 스탬프 찍기';

  return (
    <div className="sheet-card place-drawer__proof-card">
      <div className="place-drawer__proof-copy">
        <strong>오늘 스탬프</strong>
        <p>{stampActionMessage}</p>
      </div>
      <div className="place-drawer__proof-action">
        {!loggedIn ? (
          <>
            <span className="place-drawer__proof-kicker">피드와 코스 시작</span>
            <button type="button" className="primary-button place-drawer__proof-button" onClick={onRequestLogin}>
              로그인하고 시작
            </button>
          </>
        ) : (
          <button
            type="button"
            className={buttonClassName}
            onClick={onClaimStamp}
            disabled={!canClaimStamp || stampActionStatus === 'loading'}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
