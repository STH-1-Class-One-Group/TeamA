import type { CommunityRouteSort, Course, SessionUser, UserRoute } from '../../types';

export interface RoutePreviewPayload {
  id: string;
  title: string;
  subtitle: string;
  mood: string;
  placeIds: string[];
  placeNames: string[];
}

export interface CourseTabProps {
  courses: Course[];
  communityRoutes: UserRoute[];
  sort: CommunityRouteSort;
  sessionUser: SessionUser | null;
  routeLikeUpdatingId: string | null;
  highlightedRouteId: string | null;
  placeNameById: Record<string, string>;
  onChangeSort: (sort: CommunityRouteSort) => void;
  onToggleLike: (routeId: string) => Promise<void>;
  onOpenPlace: (placeId: string) => void;
  onOpenRoutePreview: (route: RoutePreviewPayload) => void;
  onRequestLogin: () => void;
}
