import { jsonResponse, redirectResponse } from '../lib/http.js';
import { encodeFilterValue, supabaseRequest } from '../lib/supabase.js';

const PROVIDERS = [
  { key: 'naver', label: '네이버' },
  { key: 'kakao', label: '카카오' },
];

const SESSION_COOKIE_NAME = 'jamissue_worker_session';
const OAUTH_STATE_COOKIE_NAME = 'jamissue_worker_oauth_state';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
const NAVER_AUTHORIZE_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';
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

export function getSigningSecret(env) {
  return env.APP_SESSION_SECRET || env.APP_JWT_SECRET || '';
}

function getSecureCookieFlag(request, env) {
  if (env.APP_SESSION_HTTPS === 'false') {
    return false;
  }
  return new URL(request.url).protocol === 'https:';
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

function clearCookie(name, secure) {
  return serializeCookie(name, '', {
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
  });
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

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(digest));
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

export async function readSessionUser(request, env) {
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

function buildRedirectUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function naverConfigured(env) {
  return Boolean(env.APP_NAVER_LOGIN_CLIENT_ID && env.APP_NAVER_LOGIN_CLIENT_SECRET && env.APP_NAVER_LOGIN_CALLBACK_URL);
}

export function buildAuthProviders(env) {
  return PROVIDERS.map((provider) => {
    if (provider.key === 'naver') {
      const enabled = naverConfigured(env);
      return {
        key: provider.key,
        label: provider.label,
        isEnabled: enabled,
        loginUrl: enabled ? '/api/auth/naver/login' : null,
      };
    }

    return {
      key: provider.key,
      label: provider.label,
      isEnabled: false,
      loginUrl: null,
    };
  });
}

export function createAuthResponse(sessionUser, env) {
  return {
    isAuthenticated: Boolean(sessionUser),
    user: sessionUser,
    providers: buildAuthProviders(env),
  };
}

function buildNaverLoginUrl(env, state) {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: env.APP_NAVER_LOGIN_CLIENT_ID,
    redirect_uri: env.APP_NAVER_LOGIN_CALLBACK_URL,
    state,
  });
  return `${NAVER_AUTHORIZE_URL}?${query.toString()}`;
}

async function exchangeNaverCode(env, code, state) {
  const query = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.APP_NAVER_LOGIN_CLIENT_ID,
    client_secret: env.APP_NAVER_LOGIN_CLIENT_SECRET,
    code,
    state,
  });
  const response = await fetch(`${NAVER_TOKEN_URL}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json();
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.message || '네이버 토큰 교환에 실패했어요.');
  }
  return payload;
}

async function fetchNaverProfile(accessToken) {
  const response = await fetch(NAVER_PROFILE_URL, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json();
  if (!response.ok || payload.resultcode !== '00' || !payload.response) {
    throw new Error(payload.message || '네이버 사용자 정보를 가져오지 못했어요.');
  }
  return payload.response;
}

async function findIdentity(env, provider, providerUserId) {
  const rows = await supabaseRequest(
    env,
    `user_identity?select=identity_id,user_id,email,profile_image&provider=eq.${encodeFilterValue(provider)}&provider_user_id=eq.${encodeFilterValue(providerUserId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function readUserRow(env, userId) {
  const rows = await supabaseRequest(
    env,
    `user?select=user_id,nickname,email,provider,profile_completed_at&user_id=eq.${encodeFilterValue(userId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function findUserByNickname(env, nickname, excludeUserId = null) {
  const normalized = String(nickname ?? '').trim();
  if (!normalized) {
    return null;
  }
  const rows = await supabaseRequest(env, 'user?select=user_id,nickname');
  return (rows ?? []).find((row) => {
    if (excludeUserId && row.user_id === excludeUserId) {
      return false;
    }
    return String(row.nickname ?? '').toLowerCase() === normalized.toLowerCase();
  }) ?? null;
}

async function ensureUniqueNickname(env, nickname, excludeUserId = null) {
  const normalized = String(nickname ?? '').trim();
  if (normalized.length < 2) {
    const error = new Error('닉네임은 두 글자 이상으로 적어 주세요.');
    error.status = 400;
    throw error;
  }
  const existing = await findUserByNickname(env, normalized, excludeUserId);
  if (existing) {
    const error = new Error('이미 사용 중인 닉네임이에요.');
    error.status = 409;
    throw error;
  }
  return normalized;
}

async function buildUniqueSocialNickname(env, nickname) {
  const base = String(nickname ?? '').trim() || '이름 없음';
  const existing = await findUserByNickname(env, base);
  if (!existing) {
    return base;
  }
  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const candidate = `${base.slice(0, 95)}${suffix}`;
    const duplicate = await findUserByNickname(env, candidate);
    if (!duplicate) {
      return candidate;
    }
  }
  throw new Error('사용 가능한 닉네임을 만들 수 없어요.');
}

async function upsertNaverUser(env, profile) {
  const fallbackNickname = profile.nickname || profile.name || '이름 없음';
  const nowIso = new Date().toISOString();
  const existingIdentity = await findIdentity(env, 'naver', profile.id);

  if (existingIdentity) {
    await supabaseRequest(env, `user?user_id=eq.${encodeFilterValue(existingIdentity.user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        email: profile.email ?? null,
        provider: 'naver',
        updated_at: nowIso,
      }),
    });
    await supabaseRequest(env, `user_identity?identity_id=eq.${encodeFilterValue(existingIdentity.identity_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        email: profile.email ?? null,
        profile_image: profile.profile_image ?? null,
        updated_at: nowIso,
      }),
    });
    const user = await readUserRow(env, existingIdentity.user_id);
    return buildSessionUser(
      existingIdentity.user_id,
      user?.nickname ?? fallbackNickname,
      user?.email ?? profile.email,
      'naver',
      profile.profile_image,
      env,
      user?.profile_completed_at ?? null,
    );
  }

  const userId = crypto.randomUUID();
  const safeNickname = await buildUniqueSocialNickname(env, fallbackNickname);
  await supabaseRequest(env, 'user', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      nickname: safeNickname,
      email: profile.email ?? null,
      provider: 'naver',
      profile_completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    }),
  });
  await supabaseRequest(env, 'user_identity', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      provider: 'naver',
      provider_user_id: profile.id,
      email: profile.email ?? null,
      profile_image: profile.profile_image ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    }),
  });

  return buildSessionUser(userId, safeNickname, profile.email, 'naver', profile.profile_image, env, null);
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

async function requireSessionUser(request, env) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}

export async function handleAuthProviders(request, env) {
  return jsonResponse(200, buildAuthProviders(env), env, request);
}

export async function handleAuthSession(request, env) {
  return jsonResponse(200, createAuthResponse(await readSessionUser(request, env), env), env, request);
}

export async function handleLogout(request, env) {
  return jsonResponse(200, createAuthResponse(null, env), env, request, {
    'set-cookie': clearCookie(SESSION_COOKIE_NAME, getSecureCookieFlag(request, env)),
  });
}

export async function handleUpdateProfile(request, env) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }
  const payload = await readJsonBody(request);

  let nickname;
  try {
    nickname = await ensureUniqueNickname(env, payload.nickname, sessionResult.sessionUser.id);
  } catch (error) {
    return jsonResponse(error.status ?? 400, { detail: error.message ?? '닉네임을 저장할 수 없어요.' }, env, request);
  }

  const nowIso = new Date().toISOString();
  await supabaseRequest(env, `user?user_id=eq.${encodeFilterValue(sessionResult.sessionUser.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      nickname,
      profile_completed_at: sessionResult.sessionUser.profileCompletedAt ?? nowIso,
      updated_at: nowIso,
    }),
  });
  const userRow = await readUserRow(env, sessionResult.sessionUser.id);
  const nextSessionUser = buildSessionUser(
    sessionResult.sessionUser.id,
    userRow?.nickname ?? nickname,
    userRow?.email ?? sessionResult.sessionUser.email,
    sessionResult.sessionUser.provider,
    sessionResult.sessionUser.profileImage,
    env,
    userRow?.profile_completed_at ?? sessionResult.sessionUser.profileCompletedAt ?? nowIso,
  );
  const sessionToken = await signPayload(getSigningSecret(env), { user: nextSessionUser, exp: nowSeconds() + SESSION_MAX_AGE_SECONDS });
  return jsonResponse(200, createAuthResponse(nextSessionUser, env), env, request, {
    'set-cookie': serializeCookie(SESSION_COOKIE_NAME, sessionToken, {
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: getSecureCookieFlag(request, env),
      sameSite: 'Lax',
      path: '/',
    }),
  });
}

export async function handleStartNaverLogin(request, env, url) {
  if (!naverConfigured(env)) {
    return jsonResponse(503, { detail: '네이버 로그인 설정이 비어 있어요.' }, env, request);
  }

  const next = url.searchParams.get('next') || env.APP_FRONTEND_URL || 'https://daejeon.jamissue.com';
  const state = crypto.randomUUID().replace(/-/g, '');
  const stateToken = await signPayload(getSigningSecret(env), {
    state,
    next,
    exp: nowSeconds() + OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return redirectResponse(buildNaverLoginUrl(env, state), env, request, [
    serializeCookie(OAUTH_STATE_COOKIE_NAME, stateToken, {
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: getSecureCookieFlag(request, env),
      sameSite: 'Lax',
      path: '/',
    }),
  ]);
}

export async function handleNaverCallback(request, env, url) {
  const secure = getSecureCookieFlag(request, env);
  const stateToken = parseCookies(request).get(OAUTH_STATE_COOKIE_NAME);
  const statePayload = await verifyPayload(getSigningSecret(env), stateToken);
  const redirectTarget = statePayload?.next || env.APP_FRONTEND_URL || 'https://daejeon.jamissue.com';
  const cleanupCookie = clearCookie(OAUTH_STATE_COOKIE_NAME, secure);

  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (error) {
    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: 'naver-error', reason: errorDescription || error }), env, request, [cleanupCookie]);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || !statePayload || statePayload.state !== state || statePayload.exp < nowSeconds()) {
    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: 'naver-error', reason: 'state-mismatch' }), env, request, [cleanupCookie]);
  }

  try {
    const tokenPayload = await exchangeNaverCode(env, code, state);
    const profile = await fetchNaverProfile(tokenPayload.access_token);
    const sessionUser = await upsertNaverUser(env, profile);
    const sessionToken = await signPayload(getSigningSecret(env), { user: sessionUser, exp: nowSeconds() + SESSION_MAX_AGE_SECONDS });

    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: 'naver-success' }), env, request, [
      cleanupCookie,
      serializeCookie(SESSION_COOKIE_NAME, sessionToken, {
        maxAge: SESSION_MAX_AGE_SECONDS,
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
      }),
    ]);
  } catch (errorValue) {
    const reason = errorValue instanceof Error ? errorValue.message : String(errorValue);
    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: 'naver-error', reason }), env, request, [cleanupCookie]);
  }
}
