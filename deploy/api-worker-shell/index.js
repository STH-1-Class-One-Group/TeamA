import { formatDate, formatDateTime, toSeoulDateKey } from './lib/dates.js';
import { applyCorsHeaders, handlePreflight, jsonResponse, redirectResponse } from './lib/http.js';
import {
  buildAuthProviders,
  createAuthResponse,
  getSigningSecret,
  handleAuthProviders,
  handleAuthSession,
  handleLogout,
  handleNaverCallback,
  handleStartNaverLogin,
  handleUpdateProfile,
  naverConfigured,
  readSessionUser,
  sha256Base64Url,
} from './services/auth.js';
import { handleBannerEvents, handleFestivalImport, handleFestivals } from './services/festivals.js';
import {
  handleCreateComment,
  handleCreateReview,
  handleDeleteComment,
  handleDeleteReview,
  handleReviewUpload,
  handleToggleReviewLike,
  handleUpdateComment,
  handleUpdateReview,
} from './services/review-interactions.js';
import {
  countUnreadNotifications,
  createUserNotification,
  handleDeleteNotification,
  handleMarkAllNotificationsRead,
  handleMarkNotificationRead,
  handleMyNotifications,
  handleNotificationRealtimeChannel,
  loadNotificationById,
  loadUserNotifications,
  publishNotificationEvent,
} from './services/notifications.js';
import { createReviewReadService } from './services/reviews.js';
import { createCommunityRouteService } from './services/community-routes.js';
import { createMyService } from './services/my.js';
import { createAdminService } from './services/admin.js';
import { createStampService } from './services/stamps.js';
import {
  buildInFilter,
  encodeFilterValue,
  getSupabaseKey,
  parseListLimit,
  rememberPending,
  supabaseRequest,
} from './lib/supabase.js';

const PROVIDERS = [
  { key: 'naver', label: '네이버' },
  { key: 'kakao', label: '카카오' },
];

const BADGE_BY_MOOD = {
  '설렘': '첫 방문',
  '친구랑': '친구 추천',
  '혼자서': '로컬 탐방',
  '데이트': '데이트 코스',
  '야경 맛집': '야경 성공',
};

const STATIC_BASE_CACHE_TTL_MS = 5 * 60 * 1000;
const FESTIVALS_CACHE_TTL_MS = 10 * 60 * 1000;
let staticBaseCache = { expiresAt: 0, value: null, pending: null };
let festivalsCache = { expiresAt: 0, syncAt: 0, value: null, pending: null };

function formatVisitLabel(visitNumber) {
  const safeVisitNumber = Number.isFinite(Number(visitNumber)) && Number(visitNumber) > 0 ? Number(visitNumber) : 1;
  return `${safeVisitNumber}번째 방문`;
}

function buildSessionDurationLabel(session) {
  const startedAt = new Date(session.started_at);
  const endedAt = new Date(session.ended_at);
  const diffMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return `당일 코스 · 스탬프 ${session.stamp_count ?? 0}개`;
  }
  return `${diffDays}박 ${diffDays + 1}일 · 스탬프 ${session.stamp_count ?? 0}개`;
}

function buildStampLogs(stampRows, placesByPositionId) {
  const todayKey = toSeoulDateKey();
  const sessionCounts = new Map();
  for (const row of stampRows) {
    if (!row.travel_session_id) {
      continue;
    }
    const sessionId = String(row.travel_session_id);
    sessionCounts.set(sessionId, (sessionCounts.get(sessionId) ?? 0) + 1);
  }

  return [...stampRows]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .map((row) => {
      const place = placesByPositionId.get(String(row.position_id));
      const travelSessionId = row.travel_session_id ? String(row.travel_session_id) : null;
      return {
        id: String(row.stamp_id),
        placeId: place?.id ?? String(row.position_id),
        placeName: place?.name ?? "?? ?? ??",
        stampedAt: formatDateTime(row.created_at),
        stampedDate: formatDate(row.created_at),
        visitNumber: row.visit_ordinal ?? 1,
        visitLabel: formatVisitLabel(row.visit_ordinal ?? 1),
        travelSessionId,
        travelSessionStampCount: travelSessionId ? Number(sessionCounts.get(travelSessionId) ?? 0) : 0,
        isToday: row.stamp_date === todayKey,
      };
    });
}

function buildTravelSessions(sessionRows, userStampRows, placesByPositionId, ownerRouteRows = []) {
  const stampsBySessionId = new Map();
  for (const stampRow of userStampRows) {
    if (!stampRow.travel_session_id) {
      continue;
    }
    const sessionId = String(stampRow.travel_session_id);
    if (!stampsBySessionId.has(sessionId)) {
      stampsBySessionId.set(sessionId, []);
    }
    stampsBySessionId.get(sessionId).push(stampRow);
  }
  const publishedRouteIdBySession = new Map(ownerRouteRows.filter((row) => row.travel_session_id).map((row) => [String(row.travel_session_id), String(row.route_id)]));
  return [...sessionRows]
    .sort((left, right) => new Date(right.started_at).getTime() - new Date(left.started_at).getTime())
    .map((session) => {
      const sessionId = String(session.travel_session_id);
      const sessionStamps = [...(stampsBySessionId.get(sessionId) ?? [])].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
      const uniquePlaceIds = [];
      const uniquePlaceNames = [];
      const seenPlaceIds = new Set();
      for (const stampRow of sessionStamps) {
        const place = placesByPositionId.get(String(stampRow.position_id));
        const placeId = place?.id ?? String(stampRow.position_id);
        if (seenPlaceIds.has(placeId)) {
          continue;
        }
        seenPlaceIds.add(placeId);
        uniquePlaceIds.push(placeId);
        uniquePlaceNames.push(place?.name ?? placeId);
      }
      return {
        id: sessionId,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        durationLabel: buildSessionDurationLabel(session),
        stampCount: session.stamp_count ?? sessionStamps.length,
        placeIds: uniquePlaceIds,
        placeNames: uniquePlaceNames,
        canPublish: uniquePlaceIds.length >= 2,
        publishedRouteId: publishedRouteIdBySession.get(sessionId) ?? null,
        coverPlaceId: uniquePlaceIds[0] ?? null,
      };
    });
}
function normalizePlaceCategory(category, slug = '') {
  const cultureSlugHints = ['museum', 'arts-center', 'art-science', 'science-museum', 'observatory'];
  if (category === 'restaurant' || category === 'cafe' || category === 'attraction' || category === 'culture') {
    return category;
  }
  if (category === 'food') {
    return 'restaurant';
  }
  if (category === 'night') {
    return 'attraction';
  }
  if (category === 'landmark') {
    return cultureSlugHints.some((hint) => slug.includes(hint)) ? 'culture' : 'attraction';
  }
  return 'attraction';
}

function getCategoryPalette(category, row) {
  const fallbackJam = row.jam_color ?? '#FFB3C6';
  const fallbackAccent = row.accent_color ?? '#FF6B9D';
  switch (category) {
    case 'restaurant':
      return { jamColor: '#FF6B9D', accentColor: '#FFB3C6', heroLabel: 'Bakery Bite', summaryPrefix: '빵과 면, 국밥까지' };
    case 'cafe':
      return { jamColor: '#7CB9D1', accentColor: '#A8D5E2', heroLabel: 'Cafe Mood', summaryPrefix: '커피와 디저트' };
    case 'culture':
      return { jamColor: '#A8D5E2', accentColor: '#C9E4EA', heroLabel: 'Culture Spot', summaryPrefix: '전시와 문화 공간' };
    case 'attraction':
      return { jamColor: '#FFB3C6', accentColor: '#FFD4E0', heroLabel: 'City Spot', summaryPrefix: '대전 산책과 명소' };
    default:
      return { jamColor: fallbackJam, accentColor: fallbackAccent, heroLabel: row.hero_label, summaryPrefix: '' };
  }
}
function mapPlace(row) {
  return {
    id: row.slug,
    positionId: String(row.position_id),
    name: row.name,
    district: row.district,
    category: normalizePlaceCategory(row.category, row.slug),
    jamColor: getCategoryPalette(normalizePlaceCategory(row.category, row.slug), row).jamColor,
    accentColor: getCategoryPalette(normalizePlaceCategory(row.category, row.slug), row).accentColor,
    imageUrl: row.image_url ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
    summary: row.summary,
    description: row.description,
    vibeTags: Array.isArray(row.vibe_tags) ? row.vibe_tags : [],
    visitTime: row.visit_time,
    routeHint: row.route_hint,
    stampReward: row.stamp_reward,
    heroLabel: getCategoryPalette(normalizePlaceCategory(row.category, row.slug), row).heroLabel,
    totalVisitCount: Number(row.total_visit_count ?? 0),
  };
}

function buildPlaceVisitCountMap(stampRows) {
  const counts = new Map();
  for (const row of stampRows ?? []) {
    const key = String(row.position_id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

async function loadStaticBaseRows(env) {
  const now = Date.now();
  if (staticBaseCache.value && staticBaseCache.expiresAt > now) {
    return staticBaseCache.value;
  }

  return rememberPending(staticBaseCache, async () => {
    const [placeRows, courseRows, coursePlaceRows] = await Promise.all([
      supabaseRequest(env, "map?select=position_id,slug,name,district,category,latitude,longitude,summary,description,image_url,image_storage_path,vibe_tags,visit_time,route_hint,stamp_reward,hero_label,jam_color,accent_color,is_active&is_active=eq.true&order=position_id.asc"),
      supabaseRequest(env, "course?select=course_id,title,mood,duration,note,color,display_order&order=display_order.asc"),
      supabaseRequest(env, "course_place?select=course_id,position_id,stop_order&order=stop_order.asc"),
    ]);
    const value = { placeRows, courseRows, coursePlaceRows };
    staticBaseCache = {
      ...staticBaseCache,
      value,
      expiresAt: Date.now() + STATIC_BASE_CACHE_TTL_MS,
      pending: null,
    };
    return value;
  });
}

const reviewReadService = createReviewReadService({
  formatVisitLabel,
  loadStaticBaseRows,
  mapPlace,
});

const communityRouteService = createCommunityRouteService({
  loadStaticBaseRows,
});

const myService = createMyService({
  communityRouteService,
  loadBaseData,
  loadStaticBaseRows,
  loadUserNotifications,
});

const adminService = createAdminService({
  normalizePlaceCategory,
});

const stampService = createStampService({
  buildNearPlaceMessage,
  loadBaseData,
});

function mapCourses(courseRows, coursePlaceRows, placesByPositionId) {
  const placeIdsByCourseId = new Map();
  for (const row of coursePlaceRows) {
    const courseId = String(row.course_id);
    if (!placeIdsByCourseId.has(courseId)) {
      placeIdsByCourseId.set(courseId, []);
    }
    placeIdsByCourseId.get(courseId).push({
      stopOrder: row.stop_order,
      placeId: placesByPositionId.get(String(row.position_id))?.id ?? String(row.position_id),
    });
  }

  return courseRows.map((row) => ({
    id: String(row.course_id),
    title: row.title,
    mood: row.mood,
    duration: row.duration,
    note: row.note,
    color: row.color,
    placeIds: (placeIdsByCourseId.get(String(row.course_id)) ?? [])
      .sort((left, right) => left.stopOrder - right.stopOrder)
      .map((item) => item.placeId),
  }));
}

async function loadBaseData(env, sessionUserId = null) {
  const [{ placeRows, courseRows, coursePlaceRows }, feedRows] = await Promise.all([
    loadStaticBaseRows(env),
    supabaseRequest(env, "feed?select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at&order=created_at.desc"),
  ]);

  const feedIdsFilter = buildInFilter(feedRows.map((row) => row.feed_id));
  const reviewStampIdsFilter = buildInFilter(feedRows.map((row) => row.stamp_id).filter(Boolean));

  const [commentRows, likeRows, reviewStampRows, userFeedLikeRows = [], userSessionRows = [], ownerRouteRows = [], userStampRows = [], allPlaceStampRows = []] = await Promise.all([
    feedIdsFilter
      ? supabaseRequest(env, `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`)
      : Promise.resolve([]),
    feedIdsFilter
      ? supabaseRequest(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`)
      : Promise.resolve([]),
    reviewStampIdsFilter
      ? supabaseRequest(env, `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${reviewStampIdsFilter}`)
      : Promise.resolve([]),
    sessionUserId && feedIdsFilter
      ? supabaseRequest(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=${feedIdsFilter}`)
      : Promise.resolve([]),
    sessionUserId
      ? supabaseRequest(env, `travel_session?select=travel_session_id,user_id,started_at,ended_at,last_stamp_at,stamp_count,created_at&user_id=eq.${encodeFilterValue(sessionUserId)}&order=started_at.desc`)
      : Promise.resolve([]),
    sessionUserId
      ? supabaseRequest(env, `user_route?select=route_id,travel_session_id&user_id=eq.${encodeFilterValue(sessionUserId)}&order=created_at.desc`)
      : Promise.resolve([]),
    sessionUserId
      ? supabaseRequest(env, `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&user_id=eq.${encodeFilterValue(sessionUserId)}&order=created_at.desc`)
      : Promise.resolve([]),
    supabaseRequest(env, "user_stamp?select=position_id"),
  ]);
  const reviewTravelSessionIds = [...new Set((reviewStampRows ?? []).map((row) => row.travel_session_id).filter(Boolean).map((value) => String(value)))];
  const reviewRouteRows = reviewTravelSessionIds.length > 0
    ? await supabaseRequest(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
    : [];

  const userIdsFilter = buildInFilter([
    ...feedRows.map((row) => row.user_id),
    ...commentRows.map((row) => row.user_id),
    ...(sessionUserId ? [sessionUserId] : []),
  ]);
  const userRows = userIdsFilter
    ? await supabaseRequest(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`)
    : [];

  const allStampRows = [...reviewStampRows, ...userStampRows.filter((row) => !reviewStampRows.some((stamp) => String(stamp.stamp_id) === String(row.stamp_id)))];
  const placeVisitCounts = buildPlaceVisitCountMap(allPlaceStampRows);
  const places = placeRows.map((row) => mapPlace({ ...row, total_visit_count: placeVisitCounts.get(String(row.position_id)) ?? 0 }));
  const placesByPositionId = new Map(places.map((place) => [place.positionId, place]));
  const usersById = new Map(userRows.map((row) => [row.user_id, row]));
  const stampRowsById = new Map((allStampRows ?? []).map((row) => [String(row.stamp_id), row]));
  const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row) => String(row.feed_id)));
  const collectedPlaceIds = [...new Set(userStampRows.map((row) => placesByPositionId.get(String(row.position_id))?.id).filter(Boolean))];
  const stampLogs = buildStampLogs(userStampRows, placesByPositionId);
  const travelSessions = buildTravelSessions(userSessionRows ?? [], userStampRows, placesByPositionId, ownerRouteRows ?? []);

  return {
    places,
    placesByPositionId,
    reviews: reviewReadService.mapReviewRows(feedRows, commentRows, likeRows, usersById, placesByPositionId, stampRowsById, reviewRouteRows, likedFeedIds),
    courses: mapCourses(courseRows, coursePlaceRows, placesByPositionId),
    collectedPlaceIds,
    stampLogs,
    travelSessions,
  };
}
function resolveOriginUrl(request, env) {
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

function buildProxyHeaders(request) {
  const incomingUrl = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', incomingUrl.host);
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''));
  headers.set('x-forwarded-for', headers.get('cf-connecting-ip') ?? '');
  return headers;
}

async function proxyToOrigin(request, env) {
  const upstreamUrl = resolveOriginUrl(request, env);
  if (!upstreamUrl) {
    return jsonResponse(501, { detail: '이 기능은 아직 Worker 브랜치에서 직접 구현되지 않았어요.' }, env, request);
  }

  const init = {
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

async function routeRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return handlePreflight(env, request);
  }

  const exactRoutes = [
    ["GET", "/api/health", () => handleHealth(request, env)],
    ["GET", "/api/auth/providers", () => handleAuthProviders(request, env)],
    ["GET", "/api/auth/me", () => handleAuthSession(request, env)],
    ["POST", "/api/auth/logout", () => handleLogout(request, env)],
    ["PATCH", "/api/auth/profile", () => handleUpdateProfile(request, env)],
    ["GET", "/api/auth/naver/login", () => handleStartNaverLogin(request, env, url)],
    ["GET", "/api/auth/naver/callback", () => handleNaverCallback(request, env, url)],
    ["GET", "/api/bootstrap", () => handleBootstrap(request, env)],
    ["GET", "/api/map-bootstrap", () => handleMapBootstrap(request, env)],
    ["GET", "/api/courses/curated", () => handleCuratedCourses(request, env)],
    ["GET", "/api/review-feed", () => reviewReadService.handleReviewFeed(request, env, url)],
    ["GET", "/api/reviews", () => reviewReadService.handleReviews(request, env, url)],
    ["POST", "/api/reviews/upload", () => handleReviewUpload(request, env, buildReviewInteractionDeps())],
    ["POST", "/api/reviews", () => handleCreateReview(request, env, buildReviewInteractionDeps())],
    ["POST", "/api/stamps/toggle", () => stampService.handleToggleStamp(request, env)],
    ["GET", "/api/community-routes", () => communityRouteService.handleCommunityRoutes(request, env, url)],
    ["POST", "/api/community-routes", () => communityRouteService.handleCreateUserRoute(request, env)],
    ["GET", "/api/my/routes", () => communityRouteService.handleMyRoutes(request, env)],
    ["GET", "/api/my/summary", () => myService.handleMySummary(request, env)],
    ["GET", "/api/my/notifications", () => handleMyNotifications(request, env)],
    ["GET", "/api/my/notifications/realtime-channel", () => handleNotificationRealtimeChannel(request, env)],
    ["GET", "/api/my/comments", () => myService.handleMyComments(request, env, url)],
    ["PATCH", "/api/notifications/read-all", () => handleMarkAllNotificationsRead(request, env)],
    ["GET", "/api/festivals", () => handleFestivals(request, env)],
    ["GET", "/api/banner/events", () => handleBannerEvents(request, env)],
    ["POST", "/api/internal/public-events/import", () => handleFestivalImport(request, env)],
    ["GET", "/api/admin/summary", () => adminService.handleAdminSummary(request, env)],
    ["POST", "/api/admin/import/public-data", () => adminService.handleAdminImportPublicData(request, env)],
  ];

  for (const [method, pathname, handler] of exactRoutes) {
    if (request.method === method && url.pathname === pathname) {
      return handler();
    }
  }

  const patternRoutes = [
    [
      "GET",
      /^\/api\/reviews\/(\d+)$/,
      (match) => reviewReadService.handleReviewDetail(request, env, match[1]),
    ],
    [
      "PATCH",
      /^\/api\/reviews\/(\d+)$/,
      (match) => handleUpdateReview(request, env, match[1], buildReviewInteractionDeps()),
    ],
    [
      "DELETE",
      /^\/api\/reviews\/(\d+)$/,
      (match) => handleDeleteReview(request, env, match[1], buildReviewInteractionDeps()),
    ],
    [
      "GET",
      /^\/api\/reviews\/(\d+)\/comments$/,
      async (match) => {
        const sessionUser = await readSessionUser(request, env);
        const comments = (await reviewReadService.loadSingleReview(env, match[1], sessionUser?.id ?? null))?.comments ?? [];
        return jsonResponse(200, comments, env, request);
      },
    ],
    [
      "POST",
      /^\/api\/reviews\/(\d+)\/comments$/,
      (match) => handleCreateComment(request, env, match[1], buildReviewInteractionDeps()),
    ],
    [
      "PATCH",
      /^\/api\/reviews\/(\d+)\/comments\/(\d+)$/,
      (match) => handleUpdateComment(request, env, match[1], match[2], buildReviewInteractionDeps()),
    ],
    [
      "DELETE",
      /^\/api\/reviews\/(\d+)\/comments\/(\d+)$/,
      (match) => handleDeleteComment(request, env, match[1], match[2], buildReviewInteractionDeps()),
    ],
    [
      "POST",
      /^\/api\/reviews\/(\d+)\/like$/,
      (match) => handleToggleReviewLike(request, env, match[1], buildReviewInteractionDeps()),
    ],
    [
      "POST",
      /^\/api\/community-routes\/(\d+)\/like$/,
      (match) => communityRouteService.handleToggleCommunityRouteLike(request, env, match[1]),
    ],
    [
      "PATCH",
      /^\/api\/notifications\/(\d+)\/read$/,
      (match) => handleMarkNotificationRead(request, env, match[1]),
    ],
    [
      "DELETE",
      /^\/api\/notifications\/(\d+)$/,
      (match) => handleDeleteNotification(request, env, match[1]),
    ],
    [
      "PATCH",
      /^\/api\/admin\/places\/([^/]+)$/,
      (match) => adminService.handleAdminPlaceVisibility(request, env, match[1]),
    ],
  ];

  for (const [method, pattern, handler] of patternRoutes) {
    const match = url.pathname.match(pattern);
    if (request.method === method && match) {
      return handler(match);
    }
  }

  return proxyToOrigin(request, env);
}
export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      return jsonResponse(500, {
        service: 'daejeon-jamissue-api',
        status: 'worker-error',
        message: error instanceof Error ? error.message : String(error),
      }, env, request);
    }
  },
};
