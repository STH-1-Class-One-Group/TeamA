import type { PlaceCategory } from '../lib/categories';
import type { Place } from './core';
import type { UserRoute } from './review';

export interface AdminPlace {
  id: string;
  name: string;
  district: string;
  category: PlaceCategory;
  isActive: boolean;
  isManualOverride: boolean;
  reviewCount: number;
  updatedAt: string;
}

export interface AdminSummaryResponse {
  userCount: number;
  placeCount: number;
  reviewCount: number;
  commentCount: number;
  stampCount: number;
  sourceReady: boolean;
  places: AdminPlace[];
}

export interface PlaceVisibilityRequest {
  isActive?: boolean;
  isManualOverride?: boolean;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  contentType: string;
  thumbnailUrl?: string | null;
}

export interface PublicImportResponse {
  importedPlaces: number;
  importedCourses: number;
}

export interface DiscoverySearchResponse {
  query: string;
  places: Place[];
  routes: UserRoute[];
}

export interface PlaceRecommendation {
  place: Place;
  score: number;
  reason: string;
}

export interface DiscoveryRecommendationsResponse {
  placeId: string;
  items: PlaceRecommendation[];
}
