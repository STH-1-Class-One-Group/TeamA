import { getClientConfig } from '../config';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_GET_TTL_MS = 15_000;
const WORKER_FALLBACK_BASE_URL = '';

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const pendingCache = new Map<string, Promise<unknown>>();

function isGetRequest(init?: RequestInit) {
  return (init?.method ?? 'GET').toUpperCase() === 'GET' && !init?.body;
}

function clonePayload<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildCacheKey(path: string, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();
  return method + ':' + path;
}

function getTtlForPath(path: string) {
  if (path.startsWith('/api/festivals') || path.startsWith('/api/banner/events')) {
    return 30 * 60 * 1000;
  }
  if (path.startsWith('/api/courses/curated')) {
    return 60 * 1000;
  }
  if (path.startsWith('/api/map-bootstrap') || path.startsWith('/api/community-routes')) {
    return 20 * 1000;
  }
  if (path.startsWith('/api/reviews') || path.startsWith('/api/my/summary')) {
    return 10 * 1000;
  }
  return DEFAULT_GET_TTL_MS;
}

export function invalidateApiCache(prefixes: string[] = []) {
  if (prefixes.length === 0) {
    responseCache.clear();
    pendingCache.clear();
    return;
  }

  for (const key of [...responseCache.keys()]) {
    if (prefixes.some((prefix) => key.includes(prefix))) {
      responseCache.delete(key);
    }
  }

  for (const key of [...pendingCache.keys()]) {
    if (prefixes.some((prefix) => key.includes(prefix))) {
      pendingCache.delete(key);
    }
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = '요청을 처리하지 못했어요.';
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      message = response.statusText || message;
    }
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jamissue:auth-expired', { detail: { path: response.url } }));
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiBaseUrl } = getClientConfig();
  const headers = new Headers(init?.headers || undefined);
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const canCache = isGetRequest(init);
  const cacheKey = buildCacheKey(path, init);
  const now = Date.now();

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (canCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return clonePayload(cached.value as T);
    }
    const pending = pendingCache.get(cacheKey);
    if (pending) {
      return clonePayload((await pending) as T);
    }
  }

  const fetchFromBase = async (baseUrl: string) => {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
      headers,
    });
    return parseJsonResponse<T>(response);
  };

  const requestPromise = (async () => {
    try {
      return await fetchFromBase(apiBaseUrl);
    } catch (error) {
      const shouldFallback = Boolean(WORKER_FALLBACK_BASE_URL) && apiBaseUrl !== WORKER_FALLBACK_BASE_URL && !(error instanceof ApiError);
      if (!shouldFallback) {
        throw error;
      }
      return fetchFromBase(WORKER_FALLBACK_BASE_URL);
    }
  })();

  if (canCache) {
    pendingCache.set(cacheKey, requestPromise as Promise<unknown>);
  }

  try {
    const payload = await requestPromise;
    if (canCache) {
      responseCache.set(cacheKey, {
        expiresAt: now + getTtlForPath(path),
        value: clonePayload(payload),
      });
    }
    return payload;
  } finally {
    if (canCache) {
      pendingCache.delete(cacheKey);
    }
  }
}

export function getApiBaseUrl() {
  return getClientConfig().apiBaseUrl;
}
