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
function mapMyComments(commentRows, feedRows, placesByPositionId) {
  const isDeletedCommentRow = (row) => {
    const body = String(row?.body ?? '').trim();
    return Boolean(row?.is_deleted) || body === '[deleted]' || body === '삭제된 댓글입니다.';
  };
  const feedById = new Map(feedRows.map((row) => [String(row.feed_id), row]));
  return commentRows.filter((row) => !isDeletedCommentRow(row)).map((row) => {
    const feed = feedById.get(String(row.feed_id));
    const place = feed ? placesByPositionId.get(String(feed.position_id)) : null;
    return {
      id: String(row.comment_id),
      reviewId: String(row.feed_id),
      placeId: place?.id ?? String(feed?.position_id ?? ''),
      placeName: place?.name ?? '장소 정보 없음',
      body: row.body,
      isDeleted: false,
      parentId: row.parent_id ? String(row.parent_id) : null,
      createdAt: formatDateTime(row.created_at),
      reviewBody: feed?.body ?? '',
    };
  });
}

async function buildAdminSummary(env) {
  const [userCount, placeCount, reviewCount, commentCount, stampCount, placeRows, feedRows] = await Promise.all([
    supabaseCount(env, 'user'),
    supabaseCount(env, 'map'),
    supabaseCount(env, 'feed'),
    supabaseCount(env, 'user_comment'),
    supabaseCount(env, 'user_stamp'),
    supabaseRequest(env, 'map?select=position_id,slug,name,district,category,is_active,is_manual_override,updated_at&order=is_active.desc,name.asc'),
    supabaseRequest(env, 'feed?select=position_id'),
  ]);

  const reviewCountByPosition = new Map();
  for (const row of feedRows ?? []) {
    const key = String(row.position_id);
    reviewCountByPosition.set(key, (reviewCountByPosition.get(key) ?? 0) + 1);
  }

  return {
    userCount,
    placeCount,
    reviewCount,
    commentCount,
    stampCount,
    sourceReady: true,
    places: (placeRows ?? []).map((row) => ({
      id: row.slug,
      name: row.name,
      district: row.district,
      category: normalizePlaceCategory(row.category, row.slug),
      isActive: Boolean(row.is_active),
      isManualOverride: Boolean(row.is_manual_override),
      reviewCount: reviewCountByPosition.get(String(row.position_id)) ?? 0,
      updatedAt: formatDateTime(row.updated_at),
    })),
  };
}

async function handleAdminSummary(request, env) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser || !sessionUser.isAdmin) {
    return jsonResponse(403, { detail: '??? ???.' }, env, request);
  }
  return jsonResponse(200, await buildAdminSummary(env), env, request);
}

async function handleAdminPlaceVisibility(request, env, placeId) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser || !sessionUser.isAdmin) {
    return jsonResponse(403, { detail: '???? ??? ? ???.' }, env, request);
  }
  const payload = await request.json().catch(() => null);
  const body = {};
  if (typeof payload?.isActive === 'boolean') body.is_active = payload.isActive;
  if (typeof payload?.isManualOverride === 'boolean') body.is_manual_override = payload.isManualOverride;
  body.updated_at = new Date().toISOString();
  const updatedRows = await supabaseRequest(env, `map?slug=eq.${encodeFilterValue(placeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const updatedRow = Array.isArray(updatedRows) ? updatedRows[0] : null;
  if (!updatedRow) {
    return jsonResponse(404, { detail: '??? ?? ? ???.' }, env, request);
  }
  const reviewRows = await supabaseRequest(env, `feed?select=feed_id&position_id=eq.${encodeFilterValue(updatedRow.position_id)}`);
  return jsonResponse(200, {
    id: updatedRow.slug,
    name: updatedRow.name,
    district: updatedRow.district,
    category: normalizePlaceCategory(updatedRow.category, updatedRow.slug),
    isActive: Boolean(updatedRow.is_active),
    isManualOverride: Boolean(updatedRow.is_manual_override),
    reviewCount: (reviewRows ?? []).length,
    updatedAt: formatDateTime(updatedRow.updated_at),
  }, env, request);
}

async function handleAdminImportPublicData(request, env) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser || !sessionUser.isAdmin) {
    return jsonResponse(403, { detail: '관리자만 공공데이터를 다시 불러올 수 있어요.' }, env, request);
  }

  const sourceRows = await supabaseRequest(
    env,
    `public_data_source?select=name,last_imported_at&source_key=eq.${encodeFilterValue('jamissue-public-event-feed')}&limit=1`,
  );
  const source = sourceRows?.[0] ?? null;

  return jsonResponse(200, {
    importedPlaces: 0,
    importedCourses: 0,
    importedEvents: 0,
    mode: 'scheduled',
    detail: '공공 행사 동기화는 GitHub Actions 주간 작업으로 처리돼요.',
    importedAt: source?.last_imported_at ?? null,
  }, env, request);
}

async function handleMySummary(request, env) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return jsonResponse(401, { detail: "로그인이 필요해요." }, env, request);
  }

  const baseData = await loadBaseData(env, sessionUser.id);
  const routes = await communityRouteService.loadCommunityRoutes(env, { ownerUserId: sessionUser.id, sessionUserId: sessionUser.id });
  const reviewItems = baseData.reviews.filter((review) => review.userId === sessionUser.id);
  const reviewById = new Map(baseData.reviews.map((review) => [String(review.id), review]));
  const notifications = await loadUserNotifications(env, sessionUser.id);
  const myCommentRows = await supabaseRequest(
    env,
    `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&user_id=eq.${encodeFilterValue(sessionUser.id)}&order=created_at.desc`,
  );
  const myComments = buildMyComments(myCommentRows ?? [], reviewById);
  const collectedSet = new Set(baseData.collectedPlaceIds);
  const visitedPlaces = baseData.places.filter((place) => collectedSet.has(place.id)).map(({ positionId, ...place }) => place);
  const unvisitedPlaces = baseData.places.filter((place) => !collectedSet.has(place.id)).map(({ positionId, ...place }) => place);

  return jsonResponse(200, {
    user: sessionUser,
    stats: {
      reviewCount: reviewItems.length,
      stampCount: baseData.stampLogs.length,
      uniquePlaceCount: collectedSet.size,
      totalPlaceCount: baseData.places.length,
      routeCount: routes.length,
    },
    reviews: reviewItems,
    comments: myComments,
    notifications,
    unreadNotificationCount: notifications.filter((notification) => !notification.isRead).length,
    stampLogs: baseData.stampLogs,
    travelSessions: baseData.travelSessions,
    visitedPlaces,
    unvisitedPlaces,
    collectedPlaces: visitedPlaces,
    routes,
  }, env, request);
}
function getStampUnlockRadius(env) {
  const parsed = Number(env.APP_STAMP_UNLOCK_RADIUS_METERS ?? '120');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120;
}

function calculateDistanceMeters(startLatitude, startLongitude, endLatitude, endLongitude) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = ((endLatitude - startLatitude) * Math.PI) / 180;
  const longitudeDelta = ((endLongitude - startLongitude) * Math.PI) / 180;
  const startLatitudeRadians = (startLatitude * Math.PI) / 180;
  const endLatitudeRadians = (endLatitude * Math.PI) / 180;

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * (2 * Math.asin(Math.sqrt(haversine)));
}

function buildNearPlaceMessage(placeName, distanceMeters, unlockRadius) {
  return `${placeName}까지 ${formatDistanceMeters(distanceMeters)} 남았어요. 반경 ${unlockRadius}m 안에 들어오면 열려요.`;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

async function requireSessionUser(request, env) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}

function buildReviewInteractionDeps() {
  return {
    badgeByMood: BADGE_BY_MOOD,
    countUnreadNotifications,
    createUserNotification,
    loadBaseData,
    loadNotificationById,
    loadSingleReview: reviewReadService.loadSingleReview,
    publishNotificationEvent,
    readSessionUser,
  };
}

async function handleToggleStamp(request, env) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const payload = await readJsonBody(request);
  const placeId = String(payload.placeId ?? "").trim();
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (!placeId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return jsonResponse(400, { detail: "장소와 현재 좌표가 필요해요." }, env, request);
  }

  const baseData = await loadBaseData(env, sessionResult.sessionUser.id);
  const place = baseData.places.find((item) => item.id === placeId);
  if (!place) {
    return jsonResponse(404, { detail: "장소를 찾지 못했어요." }, env, request);
  }

  const distanceMeters = calculateDistanceMeters(latitude, longitude, place.latitude, place.longitude);
  const unlockRadius = getStampUnlockRadius(env);
  if (distanceMeters > unlockRadius) {
    return jsonResponse(403, { detail: buildNearPlaceMessage(place.name, distanceMeters, unlockRadius) }, env, request);
  }

  const stampDate = toSeoulDateKey();
  const existingTodayRows = await supabaseRequest(env, `user_stamp?select=stamp_id&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&position_id=eq.${encodeFilterValue(place.positionId)}&stamp_date=eq.${encodeFilterValue(stampDate)}&limit=1`);
  if (existingTodayRows?.[0]) {
    const nextBaseData = await loadBaseData(env, sessionResult.sessionUser.id);
    return jsonResponse(200, {
      collectedPlaceIds: nextBaseData.collectedPlaceIds,
      logs: nextBaseData.stampLogs,
      travelSessions: nextBaseData.travelSessions,
    }, env, request);
  }

  const nowIso = new Date().toISOString();
  const placeStampRows = await supabaseRequest(env, `user_stamp?select=stamp_id&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&position_id=eq.${encodeFilterValue(place.positionId)}`);
  const visitOrdinal = (placeStampRows?.length ?? 0) + 1;

  const lastStampRows = await supabaseRequest(env, `user_stamp?select=stamp_id,travel_session_id,created_at&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&order=created_at.desc&limit=1`);
  const lastStampRow = lastStampRows?.[0] ?? null;
  let travelSessionId = null;

  if (lastStampRow) {
    const gapMs = new Date(nowIso).getTime() - new Date(lastStampRow.created_at).getTime();
    if (gapMs <= 1000 * 60 * 60 * 24) {
      if (lastStampRow.travel_session_id) {
        travelSessionId = Number(lastStampRow.travel_session_id);
        const sessionRows = await supabaseRequest(env, `travel_session?select=stamp_count&travel_session_id=eq.${encodeFilterValue(travelSessionId)}&limit=1`);
        const sessionRow = sessionRows?.[0] ?? null;
        await supabaseRequest(env, `travel_session?travel_session_id=eq.${encodeFilterValue(travelSessionId)}`, {
          method: "PATCH",
          body: JSON.stringify({
            ended_at: nowIso,
            last_stamp_at: nowIso,
            stamp_count: Number(sessionRow?.stamp_count ?? 0) + 1,
            updated_at: nowIso,
          }),
        });
      } else {
        const createdSessions = await supabaseRequest(env, "travel_session?select=travel_session_id", {
          method: "POST",
          body: JSON.stringify({
            user_id: sessionResult.sessionUser.id,
            started_at: lastStampRow.created_at,
            ended_at: nowIso,
            last_stamp_at: nowIso,
            stamp_count: 2,
            created_at: nowIso,
            updated_at: nowIso,
          }),
        });
        travelSessionId = Number(createdSessions?.[0]?.travel_session_id);
        await supabaseRequest(env, `user_stamp?stamp_id=eq.${encodeFilterValue(lastStampRow.stamp_id)}`, {
          method: "PATCH",
          body: JSON.stringify({ travel_session_id: travelSessionId }),
        });
      }
    }
  }

  if (!travelSessionId) {
    const createdSessions = await supabaseRequest(env, "travel_session?select=travel_session_id", {
      method: "POST",
      body: JSON.stringify({
        user_id: sessionResult.sessionUser.id,
        started_at: nowIso,
        ended_at: nowIso,
        last_stamp_at: nowIso,
        stamp_count: 1,
        created_at: nowIso,
        updated_at: nowIso,
      }),
    });
    travelSessionId = Number(createdSessions?.[0]?.travel_session_id);
  }

  await supabaseRequest(env, "user_stamp?select=stamp_id", {
    method: "POST",
    body: JSON.stringify({
      user_id: sessionResult.sessionUser.id,
      position_id: Number(place.positionId),
      travel_session_id: travelSessionId,
      stamp_date: stampDate,
      visit_ordinal: visitOrdinal,
      created_at: nowIso,
    }),
  });

  const nextBaseData = await loadBaseData(env, sessionResult.sessionUser.id);
  return jsonResponse(200, {
    collectedPlaceIds: nextBaseData.collectedPlaceIds,
    logs: nextBaseData.stampLogs,
    travelSessions: nextBaseData.travelSessions,
  }, env, request);
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
    ["POST", "/api/stamps/toggle", () => handleToggleStamp(request, env)],
    ["GET", "/api/community-routes", () => communityRouteService.handleCommunityRoutes(request, env, url)],
    ["POST", "/api/community-routes", () => communityRouteService.handleCreateUserRoute(request, env)],
    ["GET", "/api/my/routes", () => communityRouteService.handleMyRoutes(request, env)],
    ["GET", "/api/my/summary", () => handleMySummary(request, env)],
    ["GET", "/api/my/notifications", () => handleMyNotifications(request, env)],
    ["GET", "/api/my/notifications/realtime-channel", () => handleNotificationRealtimeChannel(request, env)],
    ["GET", "/api/my/comments", () => handleMyComments(request, env, url)],
    ["PATCH", "/api/notifications/read-all", () => handleMarkAllNotificationsRead(request, env)],
    ["GET", "/api/festivals", () => handleFestivals(request, env)],
    ["GET", "/api/banner/events", () => handleBannerEvents(request, env)],
    ["POST", "/api/internal/public-events/import", () => handleFestivalImport(request, env)],
    ["GET", "/api/admin/summary", () => handleAdminSummary(request, env)],
    ["POST", "/api/admin/import/public-data", () => handleAdminImportPublicData(request, env)],
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
      (match) => handleAdminPlaceVisibility(request, env, match[1]),
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
