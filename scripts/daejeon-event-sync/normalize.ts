import { DETAIL_BASE_URL } from './constants';
import type { ImportedEvent } from './types';

function escapeHtml(text: string) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(text: string) {
  return escapeHtml(String(text || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function toStartOfDayIso(dateKey: string) {
  return `${dateKey}T00:00:00+09:00`;
}

function toEndOfDayIso(dateKey: string) {
  return `${dateKey}T23:59:59+09:00`;
}

function normalizeSeriesKeyPart(value: string | null | undefined) {
  return String(value || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[&_·/|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
}

function toSeoulDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function parseSeoulDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`);
}

function buildSeriesGroupingKey(item: ImportedEvent) {
  return [
    normalizeSeriesKeyPart(item.title),
    normalizeSeriesKeyPart(item.venueName || item.roadAddress || ''),
  ].join('|');
}

function areSeriesDatesAdjacent(leftEnd: string, rightStart: string) {
  const leftKey = toSeoulDateKey(leftEnd);
  const rightKey = toSeoulDateKey(rightStart);
  if (!leftKey || !rightKey) {
    return false;
  }
  const nextDate = parseSeoulDateKey(leftKey);
  nextDate.setDate(nextDate.getDate() + 1);
  return parseSeoulDateKey(rightKey).getTime() <= nextDate.getTime();
}

function areSeriesPeriodsMergeable(left: ImportedEvent, right: ImportedEvent) {
  const leftStartTime = new Date(left.startsAt).getTime();
  const leftEndTime = new Date(left.endsAt).getTime();
  const rightStartTime = new Date(right.startsAt).getTime();
  const rightEndTime = new Date(right.endsAt).getTime();
  if (!Number.isFinite(leftStartTime) || !Number.isFinite(leftEndTime) || !Number.isFinite(rightStartTime) || !Number.isFinite(rightEndTime)) {
    return false;
  }
  if (rightStartTime <= leftEndTime && rightEndTime >= leftStartTime) {
    return true;
  }
  return areSeriesDatesAdjacent(left.endsAt, right.startsAt);
}

function createSeriesExternalId(title: string, startsAt: string, venueName: string | null, roadAddress: string | null) {
  const seed = `${normalizeSeriesKeyPart(title)}|${toSeoulDateKey(startsAt)}|${normalizeSeriesKeyPart(venueName || roadAddress || '')}`;
  return `festival-${Buffer.from(seed).toString('base64url').slice(0, 22)}`;
}

function mergeRawPayload(left: ImportedEvent['rawPayload'], right: ImportedEvent['rawPayload']) {
  return {
    eventSeq: left.eventSeq,
    theme: left.theme || right.theme,
    venueName: left.venueName || right.venueName,
    startDate: left.startDate || right.startDate,
    endDate: left.endDate || right.endDate,
    mergedEventSeqs: [...new Set([...(left.mergedEventSeqs || [left.eventSeq].filter(Boolean)), right.eventSeq].filter(Boolean))],
  };
}

function mergeEventSeries(items: ImportedEvent[]) {
  const sorted = [...items].sort((left, right) => {
    const startDiff = new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
    if (startDiff !== 0) {
      return startDiff;
    }
    return left.title.localeCompare(right.title, 'ko');
  });

  const merged: ImportedEvent[] = [];
  for (const item of sorted) {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      buildSeriesGroupingKey(previous) === buildSeriesGroupingKey(item) &&
      areSeriesPeriodsMergeable(previous, item)
    ) {
      if (new Date(item.endsAt).getTime() > new Date(previous.endsAt).getTime()) {
        previous.endsAt = item.endsAt;
      }
      previous.summary = previous.summary || item.summary;
      previous.rawPayload = mergeRawPayload(previous.rawPayload, item.rawPayload);
      previous.externalId = createSeriesExternalId(
        previous.title,
        previous.startsAt,
        previous.venueName || null,
        previous.roadAddress || null,
      );
      continue;
    }
    merged.push({
      ...item,
      externalId: createSeriesExternalId(item.title, item.startsAt, item.venueName || null, item.roadAddress || null),
      rawPayload: {
        ...item.rawPayload,
        mergedEventSeqs: [item.rawPayload.eventSeq].filter(Boolean),
      },
    });
  }

  return merged;
}

function deduplicateSeriesByExternalId(items: ImportedEvent[]) {
  const grouped = new Map<string, ImportedEvent>();
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
    existing.rawPayload = mergeRawPayload(existing.rawPayload, item.rawPayload);
  }
  return [...grouped.values()];
}

export function parseMaxPage(html: string) {
  const pageNumbers = [...html.matchAll(/fn_link_page\((\d+)\)/g)].map((match) => Number(match[1]));
  return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
}

export function parseEventRows(html: string) {
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    return [];
  }

  const items: ImportedEvent[] = [];
  const rowMatches = tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const rowHtml = rowMatch[1];
    const eventSeqMatch = rowHtml.match(/eventSeq=(\d+)/);
    if (!eventSeqMatch) {
      continue;
    }

    const cellMatches = [...rowHtml.matchAll(/<td\b[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/td>/gi)];
    const subjectCell = cellMatches.find((match) => match[1].includes('subject'));
    const themeCell = cellMatches.find((match) => match[1].includes('theme'));
    const locationCell = cellMatches.find((match) => match[1].includes('location'));
    const dateCells = cellMatches.filter((match) => match[1].includes('date3'));

    const title = stripHtml(subjectCell?.[2] ?? '');
    const theme = stripHtml(themeCell?.[2] ?? '').replace(/^주제\s*:\s*/u, '').trim();
    const venueName = stripHtml(locationCell?.[2] ?? '');
    const startDate = stripHtml(dateCells[0]?.[2] ?? '');
    const endDate = stripHtml(dateCells[1]?.[2] ?? '');
    const eventSeq = eventSeqMatch[1];

    if (!title || !startDate || !endDate) {
      continue;
    }

    items.push({
      externalId: `daejeon-event-${eventSeq}`,
      title,
      venueName: venueName || null,
      district: '대전',
      address: venueName || null,
      roadAddress: venueName || null,
      startsAt: toStartOfDayIso(startDate),
      endsAt: toEndOfDayIso(endDate),
      homepageUrl: `${DETAIL_BASE_URL}?eventSeq=${eventSeq}&menuSeq=504`,
      latitude: null,
      longitude: null,
      summary: [theme, venueName].filter(Boolean).join(' · ') || '대전시 공식 행사안내 일정입니다.',
      rawPayload: {
        eventSeq,
        theme,
        venueName,
        startDate,
        endDate,
      },
    });
  }

  return items;
}

export function normalizeCollectedEvents(items: ImportedEvent[]) {
  return deduplicateSeriesByExternalId(mergeEventSeries(items));
}
