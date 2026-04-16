export type EventSyncRange = {
  from: string;
  to: string;
};

export type DaejeonEventRawPayload = {
  eventSeq: string;
  theme: string;
  venueName: string;
  startDate: string;
  endDate: string;
  mergedEventSeqs?: string[];
};

export type ImportedEvent = {
  externalId: string;
  title: string;
  venueName: string | null;
  district: string;
  address: string | null;
  roadAddress: string | null;
  startsAt: string;
  endsAt: string;
  homepageUrl: string;
  latitude: null;
  longitude: null;
  summary: string;
  rawPayload: DaejeonEventRawPayload;
};

export type CollectedEvents = {
  pageCount: number;
  items: ImportedEvent[];
};
