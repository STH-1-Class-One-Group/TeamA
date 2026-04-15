import { jsonResponse } from '../../lib/http.js';

const SESSION_COOKIE_NAME = 'jamissue_worker_session';
const OAUTH_STATE_COOKIE_NAME = 'jamissue_worker_oauth_state';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
const textEncoder = new TextEncoder();

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signPayload(secret, payload) {
  const body = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyPayload(secret, token) {
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
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
  } catch {
    return null;
  }
}

function parseCookies(request) {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const cookies = new Map();
  for (const chunk of cookieHeader.split(';')) {
    const [rawName, ...valueParts] = chunk.trim().split('=');
    if (!rawName) {
      continue;
    }
    cookies.set(rawName, valueParts.join('='));
  }
  return cookies;
}

function serializeCookie(name, value, options) {
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

function getSecureCookieFlag(request, env) {
  if (env.APP_SESSION_HTTPS === 'false') {
    return false;
  }
  return new URL(request.url).protocol === 'https:';
}

function clearCookie(name, secure) {
  return serializeCookie(name, '', {
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
  });
}

function isAdminUser(env, userId) {
  const adminIds = (env.APP_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}

function buildSessionUser(userId, nickname, email, provider, profileImage, env, profileCompletedAt = null) {
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

function getSigningSecret(env) {
  return env.APP_SESSION_SECRET || env.APP_JWT_SECRET || '';
}

async function readSessionUser(request, env) {
  const sessionToken = parseCookies(request).get(SESSION_COOKIE_NAME);
  const payload = await verifyPayload(getSigningSecret(env), sessionToken);
  if (!payload?.user || (payload.exp && payload.exp < nowSeconds())) {
    return null;
  }
  return {
    ...payload.user,
    isAdmin: isAdminUser(env, payload.user.id),
    profileCompletedAt: payload.user.profileCompletedAt ?? null,
  };
}

async function issueSessionCookie(sessionUser, request, env) {
  const sessionToken = await signPayload(getSigningSecret(env), {
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

async function createOAuthStateCookie(next, state, request, env) {
  const stateToken = await signPayload(getSigningSecret(env), {
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

async function readOAuthStatePayload(request, env) {
  const stateToken = parseCookies(request).get(OAUTH_STATE_COOKIE_NAME);
  return verifyPayload(getSigningSecret(env), stateToken);
}

function createOAuthCleanupCookie(request, env) {
  return clearCookie(OAUTH_STATE_COOKIE_NAME, getSecureCookieFlag(request, env));
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

async function requireSessionUser(request, env) {
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
  getSecureCookieFlag,
  getSigningSecret,
  issueSessionCookie,
  nowSeconds,
  parseCookies,
  readOAuthStatePayload,
  readSessionUser,
  requireSessionUser,
  serializeCookie,
  sha256Base64Url,
};
