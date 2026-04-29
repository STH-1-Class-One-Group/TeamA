import { formatDate, formatDateTime, toSeoulDateKey } from '../lib/dates';
import { buildInFilter, encodeFilterValue, rememberPending, supabaseRequest } from '../lib/supabase';
import type { WorkerEnv } from '../types';

export const BADGE_BY_MOOD = {
  설렘: '첫 방문',
  친구랑: '친구 추천',
  혼자서: '로컬 탐방',
  데이트: '데이트 코스',
  '야경 맛집': '야경 성공',
};

const STATIC_BASE_CACHE_TTL_MS = 5 * 60 * 1000;

let staticBaseCache: {
  expiresAt: number;
  pending: Promise<any> | null;
  value: any | null;
} = {
  expiresAt: 0,
  pending: null,
  value: null,
};

export function formatVisitLabel(visitNumber: unknown) {
  const safeVisitNumber = Number.isFinite(Number(visitNumber)) && Number(visitNumber) > 0 ? Number(visitNumber) : 1;
  return `${safeVisitNumber}번째 방문`;
}

function buildSessionDurationLabel(session: any) {
  const startedAt = new Date(session.started_at);
  const endedAt = new Date(session.ended_at);
  const diffMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return `당일 코스 · 스탬프 ${session.stamp_count ?? 0}개`;
  }
  return `${diffDays}박 ${diffDays + 1}일 · 스탬프 ${session.stamp_count ?? 0}개`;
}

function buildStampLogs(stampRows: any[], placesByPositionId: Map<string, any>) {
  const todayKey = toSeoulDateKey();
  const sessionCounts = new Map<string, number>();

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
        placeName: place?.name ?? '?? ?? ??',
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

function buildTravelSessions(
  sessionRows: any[],
  userStampRows: any[],
  placesByPositionId: Map<string, any>,
  ownerRouteRows: any[] = [],
) {
  const stampsBySessionId = new Map<string, any[]>();
  for (const stampRow of userStampRows) {
    if (!stampRow.travel_session_id) {
      continue;
    }
    const sessionId = String(stampRow.travel_session_id);
    if (!stampsBySessionId.has(sessionId)) {
      stampsBySessionId.set(sessionId, []);
    }
    stampsBySessionId.get(sessionId)?.push(stampRow);
  }

  const publishedRouteIdBySession = new Map(
    ownerRouteRows
      .filter((row) => row.travel_session_id)
      .map((row) => [String(row.travel_session_id), String(row.route_id)]),
  );

  return [...sessionRows]
    .sort((left, right) => new Date(right.started_at).getTime() - new Date(left.started_at).getTime())
    .map((session) => {
      const sessionId = String(session.travel_session_id);
      const sessionStamps = [...(stampsBySessionId.get(sessionId) ?? [])].sort(
        (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
      );
      const uniquePlaceIds: string[] = [];
      const uniquePlaceNames: string[] = [];
      const seenPlaceIds = new Set<string>();

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

export function normalizePlaceCategory(category: string, slug = '') {
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

function getCategoryPalette(category: string, row: any) {
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

export function mapPlace(row: any) {
  const category = normalizePlaceCategory(row.category, row.slug);
  const palette = getCategoryPalette(category, row);

  return {
    id: row.slug,
    positionId: String(row.position_id),
    name: row.name,
    district: row.district,
    category,
    jamColor: palette.jamColor,
    accentColor: palette.accentColor,
    imageUrl: row.image_url ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
    summary: row.summary,
    description: row.description,
    vibeTags: Array.isArray(row.vibe_tags) ? row.vibe_tags : [],
    visitTime: row.visit_time,
    routeHint: row.route_hint,
    stampReward: row.stamp_reward,
    heroLabel: palette.heroLabel,
    totalVisitCount: Number(row.total_visit_count ?? 0),
  };
}

function buildPlaceVisitCountMap(stampRows: any[]) {
  const counts = new Map<string, number>();
  for (const row of stampRows ?? []) {
    const key = String(row.position_id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export async function loadStaticBaseRows(env: WorkerEnv) {
  const now = Date.now();
  if (staticBaseCache.value && staticBaseCache.expiresAt > now) {
    return staticBaseCache.value;
  }

  return rememberPending(staticBaseCache, async () => {
    const [placeRows, courseRows, coursePlaceRows] = await Promise.all([
      supabaseRequest(
        env,
        'map?select=position_id,slug,name,district,category,latitude,longitude,summary,description,image_url,image_storage_path,vibe_tags,visit_time,route_hint,stamp_reward,hero_label,jam_color,accent_color,is_active&is_active=eq.true&order=position_id.asc',
      ),
      supabaseRequest(env, 'course?select=course_id,title,mood,duration,note,color,display_order&order=display_order.asc'),
      supabaseRequest(env, 'course_place?select=course_id,position_id,stop_order&order=stop_order.asc'),
    ]);
    const value = { placeRows, courseRows, coursePlaceRows };
    staticBaseCache = { ...staticBaseCache, value, expiresAt: Date.now() + STATIC_BASE_CACHE_TTL_MS, pending: null };
    return value;
  });
}

export function mapCourses(courseRows: any[], coursePlaceRows: any[], placesByPositionId: Map<string, any>) {
  const placeIdsByCourseId = new Map<string, Array<{ placeId: string; stopOrder: number }>>();
  for (const row of coursePlaceRows) {
    const courseId = String(row.course_id);
    if (!placeIdsByCourseId.has(courseId)) {
      placeIdsByCourseId.set(courseId, []);
    }
    placeIdsByCourseId.get(courseId)?.push({
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

export function createLoadBaseData(reviewReadService: any) {
  return async function loadBaseData(env: WorkerEnv, sessionUserId: string | null = null) {
    const [{ placeRows, courseRows, coursePlaceRows }, feedRows] = await Promise.all([
      loadStaticBaseRows(env),
      supabaseRequest(env, 'feed?select=feed_id,position_id,user_id,stamp_id,body,mood,badge,image_url,created_at&order=created_at.desc'),
    ]);

    const feedIdsFilter = buildInFilter(feedRows.map((row: any) => row.feed_id));
    const reviewStampIdsFilter = buildInFilter(feedRows.map((row: any) => row.stamp_id).filter(Boolean));
    const [
      commentRows,
      likeRows,
      reviewStampRows,
      userFeedLikeRows = [],
      userSessionRows = [],
      ownerRouteRows = [],
      userStampRows = [],
      allPlaceStampRows = [],
    ] = await Promise.all([
      feedIdsFilter
        ? supabaseRequest(env, `user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&feed_id=${feedIdsFilter}&order=created_at.asc`)
        : Promise.resolve([]),
      feedIdsFilter ? supabaseRequest(env, `feed_like?select=feed_id,user_id&feed_id=${feedIdsFilter}`) : Promise.resolve([]),
      reviewStampIdsFilter
        ? supabaseRequest(
            env,
            `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&stamp_id=${reviewStampIdsFilter}`,
          )
        : Promise.resolve([]),
      sessionUserId && feedIdsFilter
        ? supabaseRequest(env, `feed_like?select=feed_id&user_id=eq.${encodeFilterValue(sessionUserId)}&feed_id=${feedIdsFilter}`)
        : Promise.resolve([]),
      sessionUserId
        ? supabaseRequest(
            env,
            `travel_session?select=travel_session_id,user_id,started_at,ended_at,last_stamp_at,stamp_count,created_at&user_id=eq.${encodeFilterValue(
              sessionUserId,
            )}&order=started_at.desc`,
          )
        : Promise.resolve([]),
      sessionUserId
        ? supabaseRequest(env, `user_route?select=route_id,travel_session_id&user_id=eq.${encodeFilterValue(sessionUserId)}&order=created_at.desc`)
        : Promise.resolve([]),
      sessionUserId
        ? supabaseRequest(
            env,
            `user_stamp?select=stamp_id,user_id,position_id,travel_session_id,stamp_date,visit_ordinal,created_at&user_id=eq.${encodeFilterValue(
              sessionUserId,
            )}&order=created_at.desc`,
          )
        : Promise.resolve([]),
      supabaseRequest(env, 'user_stamp?select=position_id'),
    ]);

    const reviewTravelSessionIds = [
      ...new Set(
        (reviewStampRows ?? [])
          .map((row: any) => row.travel_session_id)
          .filter(Boolean)
          .map((value: any) => String(value)),
      ),
    ];
    const reviewRouteRows =
      reviewTravelSessionIds.length > 0
        ? await supabaseRequest(env, `user_route?select=route_id,travel_session_id&travel_session_id=${buildInFilter(reviewTravelSessionIds)}`)
        : [];
    const userIdsFilter = buildInFilter([
      ...feedRows.map((row: any) => row.user_id),
      ...commentRows.map((row: any) => row.user_id),
      ...(sessionUserId ? [sessionUserId] : []),
    ]);
    const userRows = userIdsFilter ? await supabaseRequest(env, `user?select=user_id,nickname&user_id=${userIdsFilter}`) : [];
    const allStampRows = [
      ...reviewStampRows,
      ...userStampRows.filter((row: any) => !reviewStampRows.some((stamp: any) => String(stamp.stamp_id) === String(row.stamp_id))),
    ];
    const placeVisitCounts = buildPlaceVisitCountMap(allPlaceStampRows);
    const places = placeRows.map((row: any) => mapPlace({ ...row, total_visit_count: placeVisitCounts.get(String(row.position_id)) ?? 0 }));
    const placesByPositionId = new Map<string, any>(places.map((place: any) => [place.positionId, place]));
    const usersById = new Map<string, any>(userRows.map((row: any) => [row.user_id, row]));
    const stampRowsById = new Map<string, any>((allStampRows ?? []).map((row: any) => [String(row.stamp_id), row]));
    const likedFeedIds = new Set((userFeedLikeRows ?? []).map((row: any) => String(row.feed_id)));
    const collectedPlaceIds = [
      ...new Set(userStampRows.map((row: any) => placesByPositionId.get(String(row.position_id))?.id).filter(Boolean)),
    ];
    const stampLogs = buildStampLogs(userStampRows, placesByPositionId);
    const travelSessions = buildTravelSessions(userSessionRows ?? [], userStampRows, placesByPositionId, ownerRouteRows ?? []);

    return {
      places,
      placesByPositionId,
      reviews: reviewReadService.mapReviewRows(
        feedRows,
        commentRows,
        likeRows,
        usersById,
        placesByPositionId,
        stampRowsById,
        reviewRouteRows,
        likedFeedIds,
      ),
      courses: mapCourses(courseRows, coursePlaceRows, placesByPositionId),
      collectedPlaceIds,
      stampLogs,
      travelSessions,
    };
  };
}
