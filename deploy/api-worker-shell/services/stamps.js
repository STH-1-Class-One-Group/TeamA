import { toSeoulDateKey } from '../lib/dates.js';
import { jsonResponse } from '../lib/http.js';
import { encodeFilterValue, supabaseRequest } from '../lib/supabase.js';
import { readSessionUser } from './auth.js';

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

function formatDistanceMeters(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) {
    return '알 수 없음';
  }
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(distanceMeters)}m`;
}

function buildNearPlaceMessage(placeName, distanceMeters, unlockRadius) {
  return `${placeName}까지 ${formatDistanceMeters(distanceMeters)} 남아있어요. 반경 ${unlockRadius}m 안에 들어오면 열려요.`;
}

async function requireSessionUser(request, env) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

export function createStampService({ loadBaseData }) {
  async function handleToggleStamp(request, env) {
    const sessionResult = await requireSessionUser(request, env);
    if (sessionResult.response) {
      return sessionResult.response;
    }

    const payload = await readJsonBody(request);
    const placeId = String(payload.placeId ?? '').trim();
    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    if (!placeId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return jsonResponse(400, { detail: '장소와 현재 좌표가 필요해요.' }, env, request);
    }

    const baseData = await loadBaseData(env, sessionResult.sessionUser.id);
    const place = baseData.places.find((item) => item.id === placeId);
    if (!place) {
      return jsonResponse(404, { detail: '장소를 찾지 못했어요.' }, env, request);
    }

    const distanceMeters = calculateDistanceMeters(latitude, longitude, place.latitude, place.longitude);
    const unlockRadius = getStampUnlockRadius(env);
    if (distanceMeters > unlockRadius) {
      return jsonResponse(403, { detail: buildNearPlaceMessage(place.name, distanceMeters, unlockRadius) }, env, request);
    }

    const stampDate = toSeoulDateKey();
    const existingTodayRows = await supabaseRequest(
      env,
      `user_stamp?select=stamp_id&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&position_id=eq.${encodeFilterValue(place.positionId)}&stamp_date=eq.${encodeFilterValue(stampDate)}&limit=1`,
    );
    if (existingTodayRows?.[0]) {
      const nextBaseData = await loadBaseData(env, sessionResult.sessionUser.id);
      return jsonResponse(200, {
        collectedPlaceIds: nextBaseData.collectedPlaceIds,
        logs: nextBaseData.stampLogs,
        travelSessions: nextBaseData.travelSessions,
      }, env, request);
    }

    const nowIso = new Date().toISOString();
    const placeStampRows = await supabaseRequest(
      env,
      `user_stamp?select=stamp_id&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&position_id=eq.${encodeFilterValue(place.positionId)}`,
    );
    const visitOrdinal = (placeStampRows?.length ?? 0) + 1;

    const lastStampRows = await supabaseRequest(
      env,
      `user_stamp?select=stamp_id,travel_session_id,created_at&user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}&order=created_at.desc&limit=1`,
    );
    const lastStampRow = lastStampRows?.[0] ?? null;
    let travelSessionId = null;

    if (lastStampRow) {
      const gapMs = new Date(nowIso).getTime() - new Date(lastStampRow.created_at).getTime();
      if (gapMs <= 1000 * 60 * 60 * 24) {
        if (lastStampRow.travel_session_id) {
          travelSessionId = Number(lastStampRow.travel_session_id);
          const sessionRows = await supabaseRequest(
            env,
            `travel_session?select=stamp_count&travel_session_id=eq.${encodeFilterValue(travelSessionId)}&limit=1`,
          );
          const sessionRow = sessionRows?.[0] ?? null;
          await supabaseRequest(env, `travel_session?travel_session_id=eq.${encodeFilterValue(travelSessionId)}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ended_at: nowIso,
              last_stamp_at: nowIso,
              stamp_count: Number(sessionRow?.stamp_count ?? 0) + 1,
              updated_at: nowIso,
            }),
          });
        } else {
          const createdSessions = await supabaseRequest(env, 'travel_session?select=travel_session_id', {
            method: 'POST',
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
            method: 'PATCH',
            body: JSON.stringify({ travel_session_id: travelSessionId }),
          });
        }
      }
    }

    if (!travelSessionId) {
      const createdSessions = await supabaseRequest(env, 'travel_session?select=travel_session_id', {
        method: 'POST',
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

    await supabaseRequest(env, 'user_stamp?select=stamp_id', {
      method: 'POST',
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

  return {
    handleToggleStamp,
  };
}
