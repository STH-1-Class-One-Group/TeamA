import type { PlaceCategory, PlaceCategoryFilter } from '../lib/categories';

export type Category = PlaceCategoryFilter;
export type Tab = 'map' | 'event' | 'feed' | 'course' | 'my';
export type MyPageTabKey = 'stamps' | 'feeds' | 'comments' | 'routes' | 'admin';
export type DrawerState = 'closed' | 'partial' | 'full';
export type ReviewMood = '혼자서' | '친구랑' | '데이트' | '야경 맛집';
export type CourseMood = '전체' | '데이트' | '사진' | '힐링' | '비 오는 날';
export type ApiStatus = 'idle' | 'loading' | 'ready' | 'error';
export type CommunityRouteSort = 'popular' | 'latest';

export interface Place {
  id: string;
  positionId?: string;
  name: string;
  district: string;
  category: PlaceCategory;
  jamColor: string;
  accentColor: string;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  summary: string;
  description: string;
  vibeTags: string[];
  visitTime: string;
  routeHint: string;
  stampReward: string;
  heroLabel: string;
  totalVisitCount?: number;
}

export interface FestivalItem {
  id: string;
  title: string;
  venueName: string | null;
  startDate: string;
  endDate: string;
  homepageUrl: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  isOngoing: boolean;
}

export interface Course {
  id: string;
  title: string;
  mood: Exclude<CourseMood, '전체'>;
  duration: string;
  note: string;
  color: string;
  placeIds: string[];
}

export interface RoutePreview {
  id: string;
  title: string;
  subtitle: string;
  mood: string;
  placeIds: string[];
  placeNames: string[];
}

export interface RoadmapBannerSummaryItem {
  label: string;
  value: string;
  tone: 'pink' | 'blue' | 'mint';
}

export interface RoadmapBannerMilestone {
  id: string;
  dateLabel: string;
  statusLabel: string;
  title: string;
  body: string;
  deliverable: string;
}
