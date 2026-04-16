import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { CommunityRouteCard } from './course/CommunityRouteCard';
import { CourseTabHeader } from './course/CourseTabHeader';
import type { CourseTabProps } from './course/courseTabTypes';
import { useHighlightedCourseRoute } from './course/useHighlightedCourseRoute';

export function CourseTab({
  courses,
  communityRoutes,
  sort,
  sessionUser,
  routeLikeUpdatingId,
  highlightedRouteId,
  placeNameById,
  onChangeSort,
  onToggleLike,
  onOpenPlace,
  onOpenRoutePreview,
  onRequestLogin,
}: CourseTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>('course');
  const routeRefs = useHighlightedCourseRoute(highlightedRouteId);

  void courses;

  return (
    <section ref={scrollRef} className="page-panel page-panel--scrollable">
      <CourseTabHeader />

      <section className="sheet-card stack-gap">
        <div className="section-title-row section-title-row--tight">
          <div>
            <p className="eyebrow">USER GENERATED</p>
            <h3>좋아요순과 최신순으로 보는 공개 경로</h3>
          </div>
        </div>
        <div className="chip-row compact-gap">
          <button type="button" className={sort === 'popular' ? 'chip is-active' : 'chip'} onClick={() => onChangeSort('popular')}>
            좋아요순
          </button>
          <button type="button" className={sort === 'latest' ? 'chip is-active' : 'chip'} onClick={() => onChangeSort('latest')}>
            최신순
          </button>
        </div>
        <div className="community-route-list">
          {communityRoutes.map((route) => (
            <CommunityRouteCard
              key={route.id}
              route={route}
              highlightedRouteId={highlightedRouteId}
              routeLikeUpdatingId={routeLikeUpdatingId}
              sessionUser={sessionUser}
              placeNameById={placeNameById}
              routeRefs={routeRefs}
              onToggleLike={onToggleLike}
              onOpenPlace={onOpenPlace}
              onOpenRoutePreview={onOpenRoutePreview}
              onRequestLogin={onRequestLogin}
            />
          ))}
          {communityRoutes.length === 0 && <p className="empty-copy">아직 공개된 사용자 경로가 없어요.</p>}
        </div>
      </section>
    </section>
  );
}
