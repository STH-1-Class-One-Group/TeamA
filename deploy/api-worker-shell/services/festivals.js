import { formatDate, toSeoulDateKey } from '../lib/dates.js';
import { jsonResponse } from '../lib/http.js';
import { encodeFilterValue, rememberPending, supabaseRequest } from '../lib/supabase.js';

const textEncoder = new TextEncoder();
const FESTIVALS_CACHE_TTL_MS = 10 * 60 * 1000;
const INTERNAL_FESTIVAL_SOURCE_KEY = 'jamissue-public-event-feed';
const INTERNAL_FESTIVAL_SOURCE_NAME = 'Daejeon Official Event Search';
const INTERNAL_FESTIVAL_SOURCE_URL = 'https://www.daejeon.go.kr/fvu/FvuEventList.do?menuSeq=504';

let festivalsCache = { expiresAt: 0, syncAt: 0, value: null, pending: null };

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createFestivalExternalId(title, startDate, venueName, roadAddress) {
  const seed = `${title}|${startDate.toISOString()}|${venueName || ''}|${roadAddress || ''}`;
  const bytes = textEncoder.encode(seed);
  return `festival-${base64UrlEncode(bytes).slice(0, 22)}`;
}

function isFestivalOngoingInSeoul(startsAt, endsAt, nowValue = Date.now()) {
  if (!startsAt || !endsAt) {
    return false;
  }
  const startDateKey = toSeoulDateKey(startsAt);
  const endDateKey = toSeoulDateKey(endsAt);
  const nowDateKey = toSeoulDateKey(nowValue);
  return startDateKey <= nowDateKey && endDateKey >= nowDateKey;
}

function normalizeFestivalSeriesKeyPart(value) {
  return String(value || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[&_·/|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
}

function buildFestivalSeriesKey(row) {
  return [
    normalizeFestivalSeriesKeyPart(row.title),
    normalizeFestivalSeriesKeyPart(row.venue_name ?? row.road_address ?? row.address ?? ''),
  ].join('|');
}

function parseSeoulDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00+09:00`);
}

function areFestivalSeriesDatesAdjacent(leftEnd, rightStart) {
  const leftKey = toSeoulDateKey(leftEnd);
  const rightKey = toSeoulDateKey(rightStart);
  if (!leftKey || !rightKey) {
    return false;
  }
  const nextDate = parseSeoulDateKey(leftKey);
  nextDate.setDate(nextDate.getDate() + 1);
  return parseSeoulDateKey(rightKey).getTime() <= nextDate.getTime();
}

function areFestivalSeriesPeriodsMergeable(leftRow, rightRow) {
  const leftStartTime = new Date(leftRow.starts_at).getTime();
  const leftEndTime = new Date(leftRow.ends_at).getTime();
  const rightStartTime = new Date(rightRow.starts_at).getTime();
  const rightEndTime = new Date(rightRow.ends_at).getTime();
  if (!Number.isFinite(leftStartTime) || !Number.isFinite(leftEndTime) || !Number.isFinite(rightStartTime) || !Number.isFinite(rightEndTime)) {
    return false;
  }
  if (rightStartTime <= leftEndTime && rightEndTime >= leftStartTime) {
    return true;
  }
  return areFestivalSeriesDatesAdjacent(leftRow.ends_at, rightRow.starts_at);
}

function buildImportedFestivalSeriesKey(item) {
  return [
    normalizeFestivalSeriesKeyPart(item.title),
    normalizeFestivalSeriesKeyPart(item.venueName ?? item.roadAddress ?? item.address ?? ''),
  ].join('|');
}

function areImportedFestivalSeriesPeriodsMergeable(leftItem, rightItem) {
  const leftStartTime = new Date(leftItem.startsAt).getTime();
  const leftEndTime = new Date(leftItem.endsAt).getTime();
  const rightStartTime = new Date(rightItem.startsAt).getTime();
  const rightEndTime = new Date(rightItem.endsAt).getTime();
  if (!Number.isFinite(leftStartTime) || !Number.isFinite(leftEndTime) || !Number.isFinite(rightStartTime) || !Number.isFinite(rightEndTime)) {
    return false;
  }
  if (rightStartTime <= leftEndTime && rightEndTime >= leftStartTime) {
    return true;
  }
  return areFestivalSeriesDatesAdjacent(leftItem.endsAt, rightItem.startsAt);
}

function mergeImportedFestivalItems(items) {
  const sortedItems = [...items].sort((left, right) => {
    const keyOrder = buildImportedFestivalSeriesKey(left).localeCompare(buildImportedFestivalSeriesKey(right));
    if (keyOrder !== 0) {
      return keyOrder;
    }
    return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
  });

  const mergedItems = [];
  for (const item of sortedItems) {
    const previous = mergedItems[mergedItems.length - 1];
    if (
      previous &&
      buildImportedFestivalSeriesKey(previous) === buildImportedFestivalSeriesKey(item) &&
      areImportedFestivalSeriesPeriodsMergeable(previous, item)
    ) {
      if (new Date(item.startsAt).getTime() < new Date(previous.startsAt).getTime()) {
        previous.startsAt = item.startsAt;
      }
      if (new Date(item.endsAt).getTime() > new Date(previous.endsAt).getTime()) {
        previous.endsAt = item.endsAt;
      }
      if (!previous.summary && item.summary) {
        previous.summary = item.summary;
      }
      if (!previous.homepageUrl && item.homepageUrl) {
        previous.homepageUrl = item.homepageUrl;
      }
      if (!previous.roadAddress && item.roadAddress) {
        previous.roadAddress = item.roadAddress;
      }
      if (!previous.address && item.address) {
        previous.address = item.address;
      }
      if (
        (!Number.isFinite(Number(previous.latitude)) || !Number.isFinite(Number(previous.longitude))) &&
        Number.isFinite(Number(item.latitude)) &&
        Number.isFinite(Number(item.longitude))
      ) {
        previous.latitude = item.latitude;
        previous.longitude = item.longitude;
      }
      previous.rawPayload = {
        ...(previous.rawPayload || {}),
        mergedExternalIds: [
          ...new Set([
            ...(previous.rawPayload?.mergedExternalIds || []),
            ...(item.rawPayload?.mergedExternalIds || []),
            item.externalId,
          ].filter(Boolean)),
        ],
      };
      previous.externalId = createFestivalExternalId(
        previous.title,
        new Date(previous.startsAt),
        previous.venueName,
        previous.roadAddress,
      );
      continue;
    }
    mergedItems.push({
      ...item,
      externalId: createFestivalExternalId(item.title, new Date(item.startsAt), item.venueName, item.roadAddress),
      rawPayload: {
        ...(item.rawPayload || {}),
        mergedExternalIds: [item.externalId].filter(Boolean),
      },
    });
  }

  return mergedItems;
}

function deduplicateImportedFestivalItemsByExternalId(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = String(item.externalId || '');
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...item });
      continue;
    }
    if (new Date(item.startsAt).getTime() < new Date(existing.startsAt).getTime()) {
      existing.startsAt = item.startsAt;
    }
    if (new Date(item.endsAt).getTime() > new Date(existing.endsAt).getTime()) {
      existing.endsAt = item.endsAt;
    }
    if (!existing.summary && item.summary) {
      existing.summary = item.summary;
    }
    if (!existing.homepageUrl && item.homepageUrl) {
      existing.homepageUrl = item.homepageUrl;
    }
    if (!existing.roadAddress && item.roadAddress) {
      existing.roadAddress = item.roadAddress;
    }
    if (!existing.address && item.address) {
      existing.address = item.address;
    }
    if (
      (!Number.isFinite(Number(existing.latitude)) || !Number.isFinite(Number(existing.longitude))) &&
      Number.isFinite(Number(item.latitude)) &&
      Number.isFinite(Number(item.longitude))
    ) {
      existing.latitude = item.latitude;
      existing.longitude = item.longitude;
    }
    existing.rawPayload = {
      ...(existing.rawPayload || {}),
      mergedExternalIds: [
        ...new Set([
          ...(existing.rawPayload?.mergedExternalIds || []),
          ...(item.rawPayload?.mergedExternalIds || []),
          item.externalId,
        ].filter(Boolean)),
      ],
    };
  }
  return [...grouped.values()];
}

function groupFestivalRowsBySeries(rows) {
  return rows.reduce((acc, row) => {
    const previous = acc[acc.length - 1];
    if (
      previous &&
      buildFestivalSeriesKey(previous) === buildFestivalSeriesKey(row) &&
      areFestivalSeriesPeriodsMergeable(previous, row)
    ) {
      if (new Date(row.ends_at).getTime() > new Date(previous.ends_at).getTime()) {
        previous.ends_at = row.ends_at;
      }
      if (!previous.summary && row.summary) {
        previous.summary = row.summary;
      }
      if (!previous.source_page_url && row.source_page_url) {
        previous.source_page_url = row.source_page_url;
      }
      if (!previous.road_address && row.road_address) {
        previous.road_address = row.road_address;
      }
      if (!previous.address && row.address) {
        previous.address = row.address;
      }
      if (
        (!Number.isFinite(Number(previous.latitude)) || !Number.isFinite(Number(previous.longitude))) &&
        Number.isFinite(Number(row.latitude)) &&
        Number.isFinite(Number(row.longitude))
      ) {
        previous.latitude = row.latitude;
        previous.longitude = row.longitude;
      }
      return acc;
    }
    acc.push({ ...row });
    return acc;
  }, []);
}

function readFestivalText(payload, keys) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

function parseFestivalDate(value, endOfDay = false) {
  if (!value) {
    return null;
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  if (/^\d{8}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6));
    const day = Number(text.slice(6, 8));
    const date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
    parsed.setUTCHours(23, 59, 59, 0);
  }
  return parsed;
}

function getFestivalWindowEnd(now) {
  return new Date(now + 30 * 24 * 60 * 60 * 1000);
}

function getTargetFestivalCityKeyword(env) {
  const cityKeyword = String(env.APP_PUBLIC_EVENT_CITY_KEYWORD || '대전').trim();
  return cityKeyword || '대전';
}

function getTargetFestivalAreaKeywords(cityKeyword) {
  const normalized = String(cityKeyword || '').trim();
  const keywords = new Set(normalized ? [normalized] : []);

  if (normalized.includes('대전')) {
    ['대전광역시', '동구', '중구', '서구', '유성구', '대덕구'].forEach((keyword) => keywords.add(keyword));
  }

  return [...keywords];
}

function isFestivalRowInTargetArea(payload, cityKeyword) {
  const haystack = [
    readFestivalText(payload, ['district', 'signguNm']),
    readFestivalText(payload, ['title', 'eventTitle', 'fstvlNm', 'eventNm']),
    readFestivalText(payload, ['venueName', 'venue_name', 'fstvlCo', 'opar']),
    readFestivalText(payload, ['roadAddress', 'road_address', 'rdnmadr']),
    readFestivalText(payload, ['address', 'lnmadr']),
  ]
    .filter(Boolean)
    .join(' ');

  return getTargetFestivalAreaKeywords(cityKeyword).some((keyword) => haystack.includes(keyword));
}

function deriveImportedFestivalDistrict(payload, cityKeyword) {
  const explicit = readFestivalText(payload, ['district', 'signguNm']);
  if (explicit) {
    return explicit;
  }

  const combined = [
    readFestivalText(payload, ['roadAddress', 'road_address', 'rdnmadr']),
    readFestivalText(payload, ['address', 'lnmadr']),
    readFestivalText(payload, ['venueName', 'venue_name', 'fstvlCo', 'opar']),
  ]
    .filter(Boolean)
    .join(' ');
  const districtMatch = combined.match(/([가-힣]+구)/);
  return districtMatch?.[1] || cityKeyword;
}

function parseFestivalCoordinate(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function readFestivalImportToken(env) {
  return String(env.APP_EVENT_IMPORT_TOKEN || '').trim();
}

function readBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function normalizeFestivalImportItem(payload, cityKeyword) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const title = readFestivalText(payload, ['title', 'eventTitle', 'name']);
  const venueName = readFestivalText(payload, ['venueName', 'venue_name', 'placeName', 'location']);
  const roadAddress = readFestivalText(payload, ['roadAddress', 'road_address', 'address']);
  const startsAt = parseFestivalDate(readFestivalText(payload, ['startsAt', 'starts_at', 'startDate']));
  const endsAt = parseFestivalDate(readFestivalText(payload, ['endsAt', 'ends_at', 'endDate']), true);
  const homepageUrl = readFestivalText(payload, ['homepageUrl', 'homepage_url', 'sourcePageUrl', 'source_page_url']);
  const district = deriveImportedFestivalDistrict(
    {
      district: readFestivalText(payload, ['district']),
      signguNm: readFestivalText(payload, ['signguNm']),
      roadAddress,
      address: readFestivalText(payload, ['address']),
      venueName,
      title,
    },
    cityKeyword,
  );
  const latitude = parseFestivalCoordinate(readFestivalText(payload, ['latitude', 'lat']));
  const longitude = parseFestivalCoordinate(readFestivalText(payload, ['longitude', 'lng']));
  const sourceUpdatedAt = parseFestivalDate(readFestivalText(payload, ['sourceUpdatedAt', 'source_updated_at']));
  const areaProbe = {
    district,
    venueName,
    roadAddress,
    address: readFestivalText(payload, ['address']),
    title,
  };

  if (!title || !startsAt || !endsAt || !isFestivalRowInTargetArea(areaProbe, cityKeyword)) {
    return null;
  }

  return {
    externalId: readFestivalText(payload, ['externalId', 'external_id', 'eventSeq', 'id']) || createFestivalExternalId(title, startsAt, venueName, roadAddress),
    title,
    venueName,
    district,
    address: readFestivalText(payload, ['address']),
    roadAddress,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    homepageUrl,
    latitude,
    longitude,
    summary: readFestivalText(payload, ['summary', 'description']) || (venueName ? `${venueName}에서 열리는 ${cityKeyword} 행사예요.` : `${cityKeyword}에서 열리는 행사예요.`),
    rawPayload: payload.rawPayload && typeof payload.rawPayload === 'object' ? payload.rawPayload : payload,
    sourceUpdatedAt: sourceUpdatedAt ? sourceUpdatedAt.toISOString() : null,
  };
}

async function ensureImportedFestivalSource(env, requestUrl, sourceName) {
  const rows = await supabaseRequest(env, `public_data_source?select=source_id,source_key&source_key=eq.${encodeFilterValue(INTERNAL_FESTIVAL_SOURCE_KEY)}&limit=1`);
  if (rows?.[0]) {
    return rows[0];
  }

  const created = await supabaseRequest(env, 'public_data_source', {
    method: 'POST',
    body: JSON.stringify({
      source_key: INTERNAL_FESTIVAL_SOURCE_KEY,
      provider: 'public-event',
      name: sourceName,
      source_url: requestUrl,
      updated_at: new Date().toISOString(),
    }),
  });
  return Array.isArray(created) ? created[0] : created;
}

async function upsertImportedFestivalItems(env, items, options = {}) {
  const cityKeyword = getTargetFestivalCityKeyword(env);
  const normalizedItems = deduplicateImportedFestivalItemsByExternalId(
    mergeImportedFestivalItems((items || []).map((item) => normalizeFestivalImportItem(item, cityKeyword)).filter(Boolean)),
  );
  if (normalizedItems.length === 0) {
    throw new Error('No valid festival items were provided for import.');
  }

  const sourceName = String(options.sourceName || INTERNAL_FESTIVAL_SOURCE_NAME).trim() || INTERNAL_FESTIVAL_SOURCE_NAME;
  const requestUrl = String(options.sourceUrl || INTERNAL_FESTIVAL_SOURCE_URL).trim() || INTERNAL_FESTIVAL_SOURCE_URL;
  const importedAt = parseFestivalDate(options.importedAt)?.toISOString() || new Date().toISOString();
  const source = await ensureImportedFestivalSource(env, requestUrl, sourceName);
  const sourceId = source.source_id;
  const existingRows = await supabaseRequest(env, `public_event?select=public_event_id,external_id&source_id=eq.${encodeFilterValue(sourceId)}`);
  const seenExternalIds = new Set();
  const nowIso = new Date().toISOString();
  const upsertRows = [];

  for (const item of normalizedItems) {
    seenExternalIds.add(item.externalId);
    upsertRows.push({
      source_id: sourceId,
      external_id: item.externalId,
      title: item.title,
      venue_name: item.venueName,
      district: item.district,
      address: item.address,
      road_address: item.roadAddress,
      latitude: item.latitude,
      longitude: item.longitude,
      starts_at: item.startsAt,
      ends_at: item.endsAt,
      summary: item.summary,
      description: item.summary,
      source_page_url: item.homepageUrl,
      source_updated_at: item.sourceUpdatedAt,
      sync_status: 'imported',
      raw_payload: item.rawPayload,
      normalized_payload: {
        title: item.title,
        venue_name: item.venueName,
        address: item.address,
        road_address: item.roadAddress,
        starts_at: item.startsAt,
        ends_at: item.endsAt,
        homepage_url: item.homepageUrl,
        latitude: item.latitude,
        longitude: item.longitude,
      },
      updated_at: nowIso,
      created_at: nowIso,
    });
  }

  if (upsertRows.length > 0) {
    await supabaseRequest(env, 'public_event?on_conflict=source_id,external_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(upsertRows),
    });
  }

  const staleIds = (existingRows || [])
    .filter((row) => !seenExternalIds.has(String(row.external_id)))
    .map((row) => row.public_event_id);
  if (staleIds.length > 0) {
    await supabaseRequest(env, `public_event?public_event_id=in.(${staleIds.join(',')})`, {
      method: 'DELETE',
    });
  }

  await supabaseRequest(env, `public_data_source?source_id=eq.${encodeFilterValue(sourceId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: sourceName,
      source_url: requestUrl,
      last_imported_at: importedAt,
      updated_at: nowIso,
    }),
  });

  return normalizedItems;
}

async function loadFestivalRowsFromDb(env, nowIso, windowEndIso, limit = 100) {
  const rows = await supabaseRequest(
    env,
    `public_event?select=public_event_id,title,venue_name,district,address,road_address,starts_at,ends_at,summary,source_page_url,latitude,longitude&ends_at=gte.${encodeFilterValue(nowIso)}&starts_at=lte.${encodeFilterValue(windowEndIso)}&order=starts_at.asc&limit=${limit}`,
  );
  const cityKeyword = getTargetFestivalCityKeyword(env);
  return groupFestivalRowsBySeries((rows || []).filter((row) => isFestivalRowInTargetArea(row, cityKeyword)));
}

function buildFestivalCard(row, now) {
  return {
    id: String(row.public_event_id),
    title: row.title,
    venueName: row.venue_name ?? null,
    startDate: row.starts_at ? toSeoulDateKey(row.starts_at) : '',
    endDate: row.ends_at ? toSeoulDateKey(row.ends_at) : '',
    homepageUrl: row.source_page_url ?? null,
    roadAddress: row.road_address ?? row.address ?? null,
    latitude: parseFestivalCoordinate(row.latitude),
    longitude: parseFestivalCoordinate(row.longitude),
    isOngoing: isFestivalOngoingInSeoul(row.starts_at, row.ends_at, now),
  };
}

function buildBannerItem(row, now, emptyDateLabel = '') {
  return {
    id: String(row.public_event_id),
    title: row.title,
    venueName: row.venue_name ?? null,
    district: row.district ?? '',
    startDate: row.starts_at,
    endDate: row.ends_at,
    dateLabel: row.starts_at && row.ends_at ? `${formatDate(row.starts_at)} - ${formatDate(row.ends_at)}` : emptyDateLabel,
    summary: row.summary ?? '',
    sourcePageUrl: row.source_page_url ?? null,
    linkedPlaceName: null,
    isOngoing: isFestivalOngoingInSeoul(row.starts_at, row.ends_at, now),
  };
}

export async function handleFestivals(request, env) {
  const now = Date.now();
  if (festivalsCache.value && festivalsCache.expiresAt > now) {
    return jsonResponse(200, festivalsCache.value, env, request);
  }

  const festivals = await rememberPending(festivalsCache, async () => {
    const nowIso = new Date(now).toISOString();
    const windowEndIso = getFestivalWindowEnd(now).toISOString();
    const rows = await loadFestivalRowsFromDb(env, nowIso, windowEndIso, 100);
    const windowEndTime = getFestivalWindowEnd(now).getTime();
    const value = rows
      .filter((row) => {
        const startTime = new Date(row.starts_at).getTime();
        const endTime = new Date(row.ends_at).getTime();
        return Number.isFinite(startTime) && Number.isFinite(endTime) && endTime >= now && startTime <= windowEndTime;
      })
      .slice(0, 10)
      .map((row) => buildFestivalCard(row, now));

    festivalsCache = {
      ...festivalsCache,
      value,
      expiresAt: Date.now() + FESTIVALS_CACHE_TTL_MS,
      pending: null,
    };
    return value;
  });

  return jsonResponse(200, festivals, env, request);
}

export async function handleBannerEvents(request, env) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const windowEndIso = getFestivalWindowEnd(now).toISOString();
  const [eventRows, sourceRows] = await Promise.all([
    loadFestivalRowsFromDb(env, nowIso, windowEndIso, 20),
    supabaseRequest(env, `public_data_source?select=name,last_imported_at&source_key=eq.${encodeFilterValue(INTERNAL_FESTIVAL_SOURCE_KEY)}&limit=1`),
  ]);
  const source = sourceRows[0] ?? null;
  const items = eventRows.length > 0 ? eventRows.slice(0, 4).map((row) => buildBannerItem(row, now)) : [];

  return jsonResponse(200, {
    sourceReady: items.length > 0 || Boolean(source?.last_imported_at),
    sourceName: source?.name ?? null,
    importedAt: source?.last_imported_at ?? null,
    items,
  }, env, request);
}

export async function handleFestivalImport(request, env) {
  const configuredToken = readFestivalImportToken(env);
  if (!configuredToken) {
    return jsonResponse(503, { detail: 'APP_EVENT_IMPORT_TOKEN is empty.' }, env, request);
  }

  const bearerToken = readBearerToken(request);
  if (!bearerToken || bearerToken !== configuredToken) {
    return jsonResponse(401, { detail: '공공 행사 import 토큰이 올바르지 않아요.' }, env, request);
  }

  const payload = await request.json().catch(() => null);
  if (!payload || !Array.isArray(payload.items)) {
    return jsonResponse(400, { detail: 'items 배열이 필요해요.' }, env, request);
  }

  let importedItems;
  try {
    importedItems = await upsertImportedFestivalItems(env, payload.items, {
      sourceName: payload.sourceName,
      sourceUrl: payload.sourceUrl,
      importedAt: payload.importedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(422, { detail: message }, env, request);
  }

  festivalsCache = {
    expiresAt: 0,
    syncAt: Date.now(),
    value: null,
    pending: null,
  };

  return jsonResponse(200, {
    importedEvents: importedItems.length,
    sourceName: String(payload.sourceName || INTERNAL_FESTIVAL_SOURCE_NAME),
    importedAt: parseFestivalDate(payload.importedAt)?.toISOString() || new Date().toISOString(),
  }, env, request);
}
