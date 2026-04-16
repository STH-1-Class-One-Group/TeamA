import { useState } from 'react';
import type {
  AdminSummaryResponse,
  BootstrapResponse,
  FestivalItem,
  MyPageResponse,
} from '../types';
import { useCommunityRouteState } from './app-data/useCommunityRouteState';
import { useReviewCollectionState } from './app-data/useReviewCollectionState';

export function useAppDataState(selectedPlaceId: string | null) {
  const [places, setPlaces] = useState<BootstrapResponse['places']>([]);
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [courses, setCourses] = useState<BootstrapResponse['courses']>([]);
  const [stampState, setStampState] = useState<BootstrapResponse['stamps']>({
    collectedPlaceIds: [],
    logs: [],
    travelSessions: [],
  });
  const [hasRealData, setHasRealData] = useState(true);
  const [myPage, setMyPage] = useState<MyPageResponse | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminSummaryResponse | null>(null);
  const [adminBusyPlaceId, setAdminBusyPlaceId] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const communityRouteState = useCommunityRouteState();
  const reviewCollectionState = useReviewCollectionState(selectedPlaceId);

  return {
    places,
    setPlaces,
    festivals,
    setFestivals,
    ...reviewCollectionState,
    courses,
    setCourses,
    stampState,
    setStampState,
    hasRealData,
    setHasRealData,
    ...communityRouteState,
    myPage,
    setMyPage,
    adminSummary,
    setAdminSummary,
    adminBusyPlaceId,
    setAdminBusyPlaceId,
    adminLoading,
    setAdminLoading,
  };
}
