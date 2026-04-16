import { useRef, useState } from 'react';
import type { CommunityRouteSort, UserRoute } from '../../types';

export function useCommunityRouteState() {
  const [communityRoutes, setCommunityRoutes] = useState<UserRoute[]>([]);
  const [communityRouteSort, setCommunityRouteSort] = useState<CommunityRouteSort>('popular');
  const communityRoutesCacheRef = useRef<Partial<Record<CommunityRouteSort, UserRoute[]>>>({});

  function replaceCommunityRoutes(nextRoutes: UserRoute[], sort: CommunityRouteSort = communityRouteSort) {
    communityRoutesCacheRef.current[sort] = nextRoutes;
    setCommunityRoutes(nextRoutes);
  }

  function patchCommunityRoutes(routeId: string, updater: (route: UserRoute) => UserRoute) {
    const nextCache: Partial<Record<CommunityRouteSort, UserRoute[]>> = {};
    for (const sortKey of Object.keys(communityRoutesCacheRef.current) as CommunityRouteSort[]) {
      const routes = communityRoutesCacheRef.current[sortKey];
      if (!routes) {
        continue;
      }
      nextCache[sortKey] = routes.map((route) => (route.id === routeId ? updater(route) : route));
    }
    communityRoutesCacheRef.current = nextCache;
    setCommunityRoutes((current) => current.map((route) => (route.id === routeId ? updater(route) : route)));
  }

  return {
    communityRoutes,
    setCommunityRoutes,
    communityRouteSort,
    setCommunityRouteSort,
    communityRoutesCacheRef,
    replaceCommunityRoutes,
    patchCommunityRoutes,
  };
}
