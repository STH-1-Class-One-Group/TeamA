import { SEARCH_URL, SOURCE_NAME } from './daejeon-event-sync/constants';
import { collectEvents } from './daejeon-event-sync/fetch';
import type { EventSyncRange, ImportedEvent } from './daejeon-event-sync/types';

function parseArgs(argv: string[]) {
  const options = {
    dryRun: false,
    from: null as string | null,
    to: null as string | null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--from') {
      options.from = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === '--to') {
      options.to = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getSeoulDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function formatUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultRange(): EventSyncRange {
  const todayParts = getSeoulDateParts();
  const start = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + Number(process.env.FESTIVAL_SYNC_RANGE_DAYS || 90));
  return {
    from: formatUtcDateKey(start),
    to: formatUtcDateKey(end),
  };
}

async function uploadEvents(items: ImportedEvent[], range: EventSyncRange) {
  const importUrl = String(process.env.PUBLIC_EVENT_IMPORT_URL || '').trim();
  const token = String(process.env.EVENT_IMPORT_TOKEN || '').trim();

  if (!importUrl) {
    throw new Error('PUBLIC_EVENT_IMPORT_URL is required.');
  }
  if (!token) {
    throw new Error('EVENT_IMPORT_TOKEN is required.');
  }

  const response = await fetch(importUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      sourceName: SOURCE_NAME,
      sourceUrl: `${SEARCH_URL}&beginDt=${range.from}&endDt=${range.to}`,
      importedAt: new Date().toISOString(),
      items,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload imported events (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const defaultRange = getDefaultRange();
  const range: EventSyncRange = {
    from: options.from || defaultRange.from,
    to: options.to || defaultRange.to,
  };

  const { pageCount, items } = await collectEvents(range);
  console.log(`Collected ${items.length} unique events across ${pageCount} pages for ${range.from}..${range.to}.`);

  if (items[0]) {
    console.log(`First event: ${items[0].startsAt.slice(0, 10)} ${items[0].title}`);
  }

  if (options.dryRun) {
    return;
  }

  const result = await uploadEvents(items, range);
  console.log(`Uploaded ${result.importedEvents ?? items.length} events to ${process.env.PUBLIC_EVENT_IMPORT_URL}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
