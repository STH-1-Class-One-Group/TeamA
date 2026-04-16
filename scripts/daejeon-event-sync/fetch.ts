import { SEARCH_URL } from './constants';
import { normalizeCollectedEvents, parseEventRows, parseMaxPage } from './normalize';
import type { CollectedEvents, EventSyncRange, ImportedEvent } from './types';

type EventListPageRequest = EventSyncRange & {
  pageIndex: number;
};

export async function fetchEventListPage({ from, to, pageIndex }: EventListPageRequest) {
  const body = new URLSearchParams({
    menuSeq: '504',
    pageIndex: String(pageIndex),
    beginDt: from,
    endDt: to,
    themeCd: '',
    placeCd: '',
    targetCd: '',
    managementCd: '',
    searchKeyword: '',
    eventSeq: '',
  });

  const response = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      Accept: 'text/html',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Daejeon event list (${response.status}).`);
  }

  return response.text();
}

function collectUniqueItems(pages: Array<{ html: string }>) {
  const uniqueItems = new Map<string, ImportedEvent>();
  for (const page of pages) {
    for (const item of parseEventRows(page.html)) {
      uniqueItems.set(item.externalId, item);
    }
  }
  return [...uniqueItems.values()];
}

export async function collectEvents(range: EventSyncRange): Promise<CollectedEvents> {
  const firstPageHtml = await fetchEventListPage({ ...range, pageIndex: 1 });
  const maxPage = parseMaxPage(firstPageHtml);
  const pages = [{ pageIndex: 1, html: firstPageHtml }];

  for (let pageIndex = 2; pageIndex <= maxPage; pageIndex += 1) {
    pages.push({
      pageIndex,
      html: await fetchEventListPage({ ...range, pageIndex }),
    });
  }

  return {
    pageCount: maxPage,
    items: normalizeCollectedEvents(collectUniqueItems(pages)),
  };
}
