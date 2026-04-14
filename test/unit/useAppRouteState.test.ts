import { describe, expect, it } from 'vitest';
import {
  buildHistoryState,
  getRoutePreviewFromHistoryState,
  type RouteState,
} from '../../src/hooks/useAppRouteState';
import type { RoutePreview } from '../../src/types';

const routeState: RouteState = {
  tab: 'map',
  placeId: null,
  festivalId: null,
  drawerState: 'closed',
};

const routePreview: RoutePreview = {
  id: 'route-1',
  title: '봄빛 산책 코스',
  subtitle: 'tester / 04. 05. 12:00',
  mood: '데이트',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['첫 번째 장소', '두 번째 장소'],
};

describe('useAppRouteState helpers', () => {
  it('builds a history payload that keeps the route preview metadata', () => {
    expect(buildHistoryState(routeState, routePreview)).toEqual({
      ...routeState,
      routePreview,
    });
  });

  it('restores only valid route preview data from browser history state', () => {
    expect(getRoutePreviewFromHistoryState({ routePreview })).toEqual(routePreview);
    expect(getRoutePreviewFromHistoryState({ routePreview: { id: 'broken' } })).toBeNull();
    expect(getRoutePreviewFromHistoryState(null)).toBeNull();
  });
});
