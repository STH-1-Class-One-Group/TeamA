import { useScrollRestoration } from '../hooks/useScrollRestoration';
import type { FestivalItem } from '../types';

interface EventTabProps {
  festivals: FestivalItem[];
  onOpenFestival: (festivalId: string) => void;
}

function formatFestivalPeriod(festival: FestivalItem) {
  if (!festival.startDate && !festival.endDate) {
    return '일정 정보가 아직 없어요.';
  }
  if (festival.startDate === festival.endDate) {
    return festival.startDate;
  }
  return `${festival.startDate} - ${festival.endDate}`;
}

export function EventTab({ festivals, onOpenFestival }: EventTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>('event');

  return (
    <section ref={scrollRef} className="page-panel page-panel--scrollable">
      <header className="panel-header">
        <p className="eyebrow">EVENT</p>
        <h2>행사</h2>
        <p>대전에서 진행 중이거나 곧 열릴 행사를 한눈에 보고, 지도에서 바로 위치를 열 수 있어요.</p>
      </header>

      <section className="sheet-card stack-gap">
        <div className="section-title-row section-title-row--tight">
          <div>
            <p className="eyebrow">DAEJEON FESTIVALS</p>
            <h3>지금 확인할 행사</h3>
          </div>
          <span className="counter-pill">{festivals.length}개</span>
        </div>

        {festivals.length === 0 ? (
          <p className="empty-copy">현재 진행 중이거나 30일 이내 예정된 대전 행사가 없어요.</p>
        ) : (
          <div className="community-route-list">
            {festivals.map((festival) => (
              <article key={festival.id} className="community-route-card community-route-card--curated">
                <div className="community-route-card__header community-route-card__header--feedlike">
                  <div className="community-route-card__title-block">
                    <div className="community-route-card__tag-row">
                      <span className="soft-tag">{festival.isOngoing ? '진행 중' : '행사 예정'}</span>
                    </div>
                    <h4>{festival.title}</h4>
                    <p className="community-route-meta community-route-meta--inline">{formatFestivalPeriod(festival)}</p>
                  </div>
                </div>

                <div className="stack-gap stack-gap--compact">
                  <p>{festival.venueName || '개최 장소 정보가 아직 없어요.'}</p>
                  <p className="section-copy">{festival.roadAddress || '도로명 주소 정보가 아직 없어요.'}</p>
                </div>

                <div className="review-card__actions review-card__actions--course">
                  <button type="button" className="review-link-button" onClick={() => onOpenFestival(festival.id)}>
                    지도에서 보기
                  </button>
                  {festival.homepageUrl ? (
                    <a className="review-link-button" href={festival.homepageUrl} target="_blank" rel="noreferrer">
                      홈페이지 열기
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
