import type { Tab } from '../../types';

type RouteDrawerState = 'closed' | 'partial' | 'full';

export type InitialRouteState = {
  tab: Tab;
  placeId: string | null;
  festivalId: string | null;
  drawerState: RouteDrawerState;
};

const validTabs: Tab[] = ['map', 'event', 'feed', 'course', 'my'];

export function getInitialRouteState(): InitialRouteState {
  if (typeof window === 'undefined') {
    return { tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' };
  }

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const placeId = params.get('place');
  const festivalId = params.get('festival');
  const drawer = params.get('drawer');
  const resolvedTab = tab && validTabs.includes(tab as Tab) ? (tab as Tab) : params.get('auth') ? 'my' : 'map';
  const resolvedDrawer = drawer === 'full' || drawer === 'partial' ? drawer : placeId || festivalId ? 'partial' : 'closed';

  return {
    tab: resolvedTab,
    placeId: placeId || null,
    festivalId: festivalId || null,
    drawerState: resolvedDrawer,
  };
}

export function getInitialNotice() {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const auth = params.get('auth');
  const reason = params.get('reason');
  if (auth === 'naver-success') {
    return '네이버 로그인을 완료했어요.';
  }
  if (auth === 'naver-linked') {
    return '네이버 계정을 연결했어요.';
  }
  if (auth === 'naver-error') {
    return reason ? `네이버 로그인에 실패했어요. (${reason})` : '네이버 로그인에 실패했어요.';
  }
  if (auth === 'kakao-success') {
    return '카카오 로그인을 완료했어요.';
  }
  if (auth === 'kakao-linked') {
    return '카카오 계정을 연결했어요.';
  }
  if (auth === 'kakao-error') {
    return reason ? `카카오 로그인에 실패했어요. (${reason})` : '카카오 로그인에 실패했어요.';
  }
  return null;
}

export function clearAuthQueryParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (!params.has('auth') && !params.has('reason')) {
    return;
  }

  params.delete('auth');
  params.delete('reason');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  window.history.replaceState(window.history.state ?? {}, '', nextUrl);
}

export function getLoginReturnUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000/?tab=my';
  }

  return `${window.location.origin}/?tab=my`;
}
