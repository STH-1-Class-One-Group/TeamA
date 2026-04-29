import { applyCorsHeaders, handlePreflight, jsonResponse } from '../lib/http';
import { getSupabaseKey } from '../lib/supabase';
import {
  createAuthResponse,
  handleAuthProviders,
  handleAuthSession,
  handleKakaoCallback,
  handleLogout,
  handleNaverCallback,
  handleStartKakaoLogin,
  handleStartNaverLogin,
  handleUpdateProfile,
  kakaoConfigured,
  naverConfigured,
  readSessionUser,
} from '../services/auth';
import { handleCreateComment, handleCreateReview, handleDeleteComment, handleDeleteReview, handleReviewUpload, handleToggleReviewLike, handleUpdateComment, handleUpdateReview } from '../services/review-interactions';
import { handleBannerEvents, handleFestivalImport, handleFestivals } from '../services/festivals';
import { handleDeleteNotification, handleMarkAllNotificationsRead, handleMarkNotificationRead, handleMyNotifications, handleNotificationRealtimeChannel } from '../services/notifications';
import type { WorkerEnv } from '../types';

interface RouteRuntime {
  adminService: any;
  buildReviewInteractionDeps: () => any;
  communityRouteService: any;
  loadBaseData: (env: WorkerEnv, sessionUserId?: string | null) => Promise<any>;
  loadStaticBaseRows: (env: WorkerEnv) => Promise<any>;
  mapCourses: (courseRows: any[], coursePlaceRows: any[], placesByPositionId: Map<string, any>) => any[];
  mapPlace: (row: any) => any;
  myService: any;
  reviewReadService: any;
  stampService: any;
}

async function handleHealth(request: Request, env: WorkerEnv) {
  return jsonResponse(
    200,
    {
      status: 'ok',
      env: env.APP_ENV ?? 'worker-first',
      databaseUrl: env.APP_SUPABASE_URL ?? '',
      databaseProvider: 'supabase-rest',
      storageBackend: env.APP_STORAGE_BACKEND ?? 'supabase',
      storagePath: env.APP_SUPABASE_STORAGE_BUCKET ? `supabase://${env.APP_SUPABASE_STORAGE_BUCKET}` : '',
      supabaseConfigured: Boolean(env.APP_SUPABASE_URL && getSupabaseKey(env)),
      frontendUrlConfigured: Boolean(env.APP_FRONTEND_URL),
      corsOriginsConfigured: Boolean(env.APP_CORS_ORIGINS),
      naverLoginConfigured: naverConfigured(env),
      naverLoginClientIdConfigured: Boolean(env.APP_NAVER_LOGIN_CLIENT_ID),
      naverLoginClientSecretConfigured: Boolean(env.APP_NAVER_LOGIN_CLIENT_SECRET),
      naverLoginCallbackUrlConfigured: Boolean(env.APP_NAVER_LOGIN_CALLBACK_URL),
      naverLoginCallbackUrl: env.APP_NAVER_LOGIN_CALLBACK_URL ?? '',
      kakaoLoginConfigured: kakaoConfigured(env),
      kakaoLoginClientIdConfigured: Boolean(env.APP_KAKAO_LOGIN_CLIENT_ID),
      kakaoLoginClientSecretConfigured: Boolean(env.APP_KAKAO_LOGIN_CLIENT_SECRET),
      kakaoLoginCallbackUrlConfigured: Boolean(env.APP_KAKAO_LOGIN_CALLBACK_URL),
      kakaoLoginCallbackUrl: env.APP_KAKAO_LOGIN_CALLBACK_URL ?? '',
    },
    env,
    request,
  );
}

async function handleMapBootstrap(request: Request, env: WorkerEnv, runtime: RouteRuntime) {
  const sessionUser = await readSessionUser(request, env);
  const mapData = await runtime.loadBaseData(env, sessionUser?.id ?? null);
  return jsonResponse(
    200,
    {
      auth: createAuthResponse(sessionUser, env),
      places: mapData.places.map(({ positionId: _positionId, ...place }: any) => place),
      stamps: {
        collectedPlaceIds: mapData.collectedPlaceIds,
        logs: mapData.stampLogs,
        travelSessions: mapData.travelSessions,
      },
      hasRealData: mapData.places.length > 0,
    },
    env,
    request,
  );
}

async function handleCuratedCourses(request: Request, env: WorkerEnv, runtime: RouteRuntime) {
  const { placeRows, courseRows, coursePlaceRows } = await runtime.loadStaticBaseRows(env);
  const places = placeRows.map((row: any) => runtime.mapPlace(row));
  const placesByPositionId = new Map<string, any>(places.map((place: any) => [place.positionId, place]));
  return jsonResponse(200, { courses: runtime.mapCourses(courseRows, coursePlaceRows, placesByPositionId) }, env, request);
}

async function handleBootstrap(request: Request, env: WorkerEnv, runtime: RouteRuntime) {
  const sessionUser = await readSessionUser(request, env);
  const baseData = await runtime.loadBaseData(env, sessionUser?.id ?? null);
  return jsonResponse(
    200,
    {
      auth: createAuthResponse(sessionUser, env),
      places: baseData.places.map(({ positionId: _positionId, ...place }: any) => place),
      reviews: baseData.reviews,
      courses: baseData.courses,
      stamps: {
        collectedPlaceIds: baseData.collectedPlaceIds,
        logs: baseData.stampLogs,
        travelSessions: baseData.travelSessions,
      },
      hasRealData: baseData.places.length > 0,
    },
    env,
    request,
  );
}

function resolveOriginUrl(request: Request, env: WorkerEnv) {
  const originBaseUrl = (env.APP_ORIGIN_API_URL ?? '').trim();
  if (!originBaseUrl) {
    return null;
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(originBaseUrl);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl;
}

function buildProxyHeaders(request: Request) {
  const incomingUrl = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', incomingUrl.host);
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''));
  headers.set('x-forwarded-for', headers.get('cf-connecting-ip') ?? '');
  return headers;
}

async function proxyToOrigin(request: Request, env: WorkerEnv) {
  const upstreamUrl = resolveOriginUrl(request, env);
  if (!upstreamUrl) {
    return jsonResponse(501, { detail: '이 기능은 아직 Worker 브랜치에서 직접 구현되지 않았어요.' }, env, request);
  }

  const init: RequestInit = {
    method: request.method,
    headers: buildProxyHeaders(request),
    redirect: 'manual',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  const upstreamResponse = await fetch(upstreamUrl.toString(), init);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set('cache-control', 'no-store');
  applyCorsHeaders(responseHeaders, env, request);
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export function createRouteRequest(runtime: RouteRuntime) {
  return async function routeRequest(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handlePreflight(env, request);
    }

    const exactRoutes: Array<[string, string, () => Promise<Response>]> = [
      ['GET', '/api/health', () => handleHealth(request, env)],
      ['GET', '/api/auth/providers', () => handleAuthProviders(request, env)],
      ['GET', '/api/auth/me', () => handleAuthSession(request, env)],
      ['POST', '/api/auth/logout', () => handleLogout(request, env)],
      ['PATCH', '/api/auth/profile', () => handleUpdateProfile(request, env)],
      ['GET', '/api/auth/naver/login', () => handleStartNaverLogin(request, env, url)],
      ['GET', '/api/auth/naver/callback', () => handleNaverCallback(request, env, url)],
      ['GET', '/api/auth/kakao/login', () => handleStartKakaoLogin(request, env, url)],
      ['GET', '/api/auth/kakao/callback', () => handleKakaoCallback(request, env, url)],
      ['GET', '/api/bootstrap', () => handleBootstrap(request, env, runtime)],
      ['GET', '/api/map-bootstrap', () => handleMapBootstrap(request, env, runtime)],
      ['GET', '/api/courses/curated', () => handleCuratedCourses(request, env, runtime)],
      ['GET', '/api/review-feed', () => runtime.reviewReadService.handleReviewFeed(request, env, url)],
      ['GET', '/api/reviews', () => runtime.reviewReadService.handleReviews(request, env, url)],
      ['POST', '/api/reviews/upload', () => handleReviewUpload(request, env, runtime.buildReviewInteractionDeps())],
      ['POST', '/api/reviews', () => handleCreateReview(request, env, runtime.buildReviewInteractionDeps())],
      ['POST', '/api/stamps/toggle', () => runtime.stampService.handleToggleStamp(request, env)],
      ['GET', '/api/community-routes', () => runtime.communityRouteService.handleCommunityRoutes(request, env, url)],
      ['POST', '/api/community-routes', () => runtime.communityRouteService.handleCreateUserRoute(request, env)],
      ['GET', '/api/my/routes', () => runtime.communityRouteService.handleMyRoutes(request, env)],
      ['GET', '/api/my/summary', () => runtime.myService.handleMySummary(request, env)],
      ['GET', '/api/my/notifications', () => handleMyNotifications(request, env)],
      ['GET', '/api/my/notifications/realtime-channel', () => handleNotificationRealtimeChannel(request, env)],
      ['GET', '/api/my/comments', () => runtime.myService.handleMyComments(request, env, url)],
      ['PATCH', '/api/notifications/read-all', () => handleMarkAllNotificationsRead(request, env)],
      ['GET', '/api/festivals', () => handleFestivals(request, env)],
      ['GET', '/api/banner/events', () => handleBannerEvents(request, env)],
      ['POST', '/api/internal/public-events/import', () => handleFestivalImport(request, env)],
      ['GET', '/api/admin/summary', () => runtime.adminService.handleAdminSummary(request, env)],
      ['POST', '/api/admin/import/public-data', () => runtime.adminService.handleAdminImportPublicData(request, env)],
    ];

    for (const [method, pathname, handler] of exactRoutes) {
      if (request.method === method && url.pathname === pathname) {
        return handler();
      }
    }

    const patternRoutes: Array<[string, RegExp, (match: RegExpMatchArray) => Promise<Response>]> = [
      ['GET', /^\/api\/reviews\/(\d+)$/, (match) => runtime.reviewReadService.handleReviewDetail(request, env, match[1])],
      ['PATCH', /^\/api\/reviews\/(\d+)$/, (match) => handleUpdateReview(request, env, match[1], runtime.buildReviewInteractionDeps())],
      ['DELETE', /^\/api\/reviews\/(\d+)$/, (match) => handleDeleteReview(request, env, match[1], runtime.buildReviewInteractionDeps())],
      [
        'GET',
        /^\/api\/reviews\/(\d+)\/comments$/,
        async (match) => {
          const sessionUser = await readSessionUser(request, env);
          const comments = (await runtime.reviewReadService.loadSingleReview(env, match[1], sessionUser?.id ?? null))?.comments ?? [];
          return jsonResponse(200, comments, env, request);
        },
      ],
      ['POST', /^\/api\/reviews\/(\d+)\/comments$/, (match) => handleCreateComment(request, env, match[1], runtime.buildReviewInteractionDeps())],
      [
        'PATCH',
        /^\/api\/reviews\/(\d+)\/comments\/(\d+)$/,
        (match) => handleUpdateComment(request, env, match[1], match[2], runtime.buildReviewInteractionDeps()),
      ],
      [
        'DELETE',
        /^\/api\/reviews\/(\d+)\/comments\/(\d+)$/,
        (match) => handleDeleteComment(request, env, match[1], match[2], runtime.buildReviewInteractionDeps()),
      ],
      ['POST', /^\/api\/reviews\/(\d+)\/like$/, (match) => handleToggleReviewLike(request, env, match[1], runtime.buildReviewInteractionDeps())],
      ['POST', /^\/api\/community-routes\/(\d+)\/like$/, (match) => runtime.communityRouteService.handleToggleCommunityRouteLike(request, env, match[1])],
      ['PATCH', /^\/api\/notifications\/(\d+)\/read$/, (match) => handleMarkNotificationRead(request, env, match[1])],
      ['DELETE', /^\/api\/notifications\/(\d+)$/, (match) => handleDeleteNotification(request, env, match[1])],
      ['PATCH', /^\/api\/admin\/places\/([^/]+)$/, (match) => runtime.adminService.handleAdminPlaceVisibility(request, env, match[1])],
    ];

    for (const [method, pattern, handler] of patternRoutes) {
      const match = url.pathname.match(pattern);
      if (request.method === method && match) {
        return handler(match);
      }
    }

    return proxyToOrigin(request, env);
  };
}
