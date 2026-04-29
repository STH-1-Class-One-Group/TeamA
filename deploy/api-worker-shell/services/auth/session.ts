import { jsonResponse } from '../../lib/http';
import type { WorkerEnv, WorkerSessionUser } from '../../types';

const SESSION_COOKIE_NAME = 'jamissue_worker_session';
const OAUTH_STATE_COOKIE_NAME = 'jamissue_worker_oauth_state';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

const textEncoder = new TextEncoder();

interface CookieOptions {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

interface SessionPayload {
  user: WorkerSessionUser;
  exp: number;
}

interface OAuthStatePayload {
  state: string;
  next: string;
  exp: number;
}

class MissingSigningSecretError extends Error {
  constructor() {
    super('APP_SESSION_SECRET is required for issuing Worker auth cookies.');
    this.name = 'MissingSigningSecretError';
  }
}

function isMissingSigningSecretError(error: unknown) {
  return error instanceof MissingSigningSecretError;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

async function signPayload(secret: string, payload: unknown) {
  const body = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyPayload<T>(secret: string, token: string | undefined) {
  if (!token || !secret) {
    return null;
  }

  const [body, signature] = token.split('.');
  if (!body || !signature) {
    return null;
  }

  try {
    const key = await importHmacKey(secret);
    const isValid = await crypto.subtle.verify('HMAC', key, base64UrlDecode(signature), textEncoder.encode(body));
    if (!isValid) {
      return null;
    }
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as T;
  } catch {
    return null;
  }
}

function parseCookies(request: Request) {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const cookies = new Map<string, string>();

  for (const chunk of cookieHeader.split(';')) {
    const [rawName, ...valueParts] = chunk.trim().split('=');
    if (!rawName) {
      continue;
    }
    cookies.set(rawName, valueParts.join('='));
  }

  return cookies;
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }
  if (options.secure) {
    parts.push('Secure');
  }
  parts.push(`SameSite=${options.sameSite ?? 'Lax'}`);
  return parts.join('; ');
}

function getSecureCookieFlag(request: Request, env: WorkerEnv) {
  if (env.APP_SESSION_HTTPS === 'false') {
    return false;
  }
  return new URL(request.url).protocol === 'https:';
}

function clearCookie(name: string, secure: boolean) {
  return serializeCookie(name, '', {
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
  });
}

function isAdminUser(env: WorkerEnv, userId: string) {
  const adminIds = (env.APP_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}

function buildSessionUser(
  userId: string,
  nickname: string,
  email: string | null | undefined,
  provider: string,
  profileImage: string | null | undefined,
  env: WorkerEnv,
  profileCompletedAt: string | null = null,
): WorkerSessionUser {
  return {
    id: userId,
    nickname,
    email: email ?? null,
    provider,
    profileImage: profileImage ?? null,
    isAdmin: isAdminUser(env, userId),
    profileCompletedAt: profileCompletedAt ?? null,
  };
}

function getSigningSecret(env: WorkerEnv) {
  return String(env.APP_SESSION_SECRET || env.APP_JWT_SECRET || '').trim();
}

function requireSigningSecret(env: WorkerEnv) {
  const secret = getSigningSecret(env);
  if (!secret) {
    throw new MissingSigningSecretError();
  }
  return secret;
}

async function readSessionUser(request: Request, env: WorkerEnv) {
  const sessionToken = parseCookies(request).get(SESSION_COOKIE_NAME);
  const payload = await verifyPayload<SessionPayload>(getSigningSecret(env), sessionToken);
  if (!payload?.user || (payload.exp && payload.exp < nowSeconds())) {
    return null;
  }

  return {
    ...payload.user,
    isAdmin: isAdminUser(env, payload.user.id),
    profileCompletedAt: payload.user.profileCompletedAt ?? null,
  };
}

async function issueSessionCookie(sessionUser: WorkerSessionUser, request: Request, env: WorkerEnv) {
  const sessionToken = await signPayload(requireSigningSecret(env), {
    user: sessionUser,
    exp: nowSeconds() + SESSION_MAX_AGE_SECONDS,
  });

  return serializeCookie(SESSION_COOKIE_NAME, sessionToken, {
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: getSecureCookieFlag(request, env),
    sameSite: 'Lax',
    path: '/',
  });
}

async function createOAuthStateCookie(next: string, state: string, request: Request, env: WorkerEnv) {
  const stateToken = await signPayload(requireSigningSecret(env), {
    state,
    next,
    exp: nowSeconds() + OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return serializeCookie(OAUTH_STATE_COOKIE_NAME, stateToken, {
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: getSecureCookieFlag(request, env),
    sameSite: 'Lax',
    path: '/',
  });
}

async function readOAuthStatePayload(request: Request, env: WorkerEnv) {
  const stateToken = parseCookies(request).get(OAUTH_STATE_COOKIE_NAME);
  return verifyPayload<OAuthStatePayload>(getSigningSecret(env), stateToken);
}

function createOAuthCleanupCookie(request: Request, env: WorkerEnv) {
  return clearCookie(OAUTH_STATE_COOKIE_NAME, getSecureCookieFlag(request, env));
}

function createSessionCleanupCookie(request: Request, env: WorkerEnv) {
  return clearCookie(SESSION_COOKIE_NAME, getSecureCookieFlag(request, env));
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

async function requireSessionUser(request: Request, env: WorkerEnv) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}

export {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  buildSessionUser,
  createOAuthCleanupCookie,
  createOAuthStateCookie,
  createSessionCleanupCookie,
  getSecureCookieFlag,
  getSigningSecret,
  isMissingSigningSecretError,
  issueSessionCookie,
  nowSeconds,
  parseCookies,
  readOAuthStatePayload,
  readSessionUser,
  requireSessionUser,
  requireSigningSecret,
  serializeCookie,
  sha256Base64Url,
};
