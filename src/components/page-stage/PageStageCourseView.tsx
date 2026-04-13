import { CourseTab } from '../CourseTab';
import type { AppPageStageProps } from '../AppPageStage';

type PageStageCourseViewProps = Pick<AppPageStageProps, 'sharedData' | 'courseData' | 'sharedActions' | 'courseActions'>;

export function PageStageCourseView({
  sharedData,
  courseData,
  sharedActions,
  courseActions,
}: PageStageCourseViewProps) {
  return (
    <CourseTab
      courses={courseData.courses}
      communityRoutes={courseData.communityRoutes}
      sort={courseData.communityRouteSort}
      sessionUser={sharedData.sessionUser}
      routeLikeUpdatingId={courseData.routeLikeUpdatingId}
      highlightedRouteId={courseData.highlightedRouteId}
      placeNameById={sharedData.placeNameById}
      onChangeSort={courseActions.onChangeRouteSort}
      onToggleLike={courseActions.onToggleRouteLike}
      onOpenPlace={sharedActions.onOpenPlace}
      onOpenRoutePreview={courseActions.onOpenRoutePreview}
      onRequestLogin={sharedActions.onRequestLogin}
    />
  );
}
