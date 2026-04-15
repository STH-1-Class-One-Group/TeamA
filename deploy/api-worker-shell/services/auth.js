import { jsonResponse, redirectResponse } from '../lib/http.js';
import { supabaseRequest } from '../lib/supabase.js';
import { buildAuthProviders, kakaoConfigured, naverConfigured } from './auth/provider-config.js';
import { buildKakaoLoginUrl, exchangeKakaoCode, fetchKakaoProfile } from './auth/kakao-provider.js';
import { buildNaverLoginUrl, exchangeNaverCode, fetchNaverProfile } from './auth/naver-provider.js';
import {
  createOAuthCleanupCookie,
  createOAuthStateCookie,
  getSigningSecret,
  issueSessionCookie,
  nowSeconds,
  readOAuthStatePayload,
  readSessionUser,
  requireSessionUser,
  sha256Base64Url,
} from './auth/session.js';
import { ensureUniqueNickname, readUserRow, upsertSocialUser } from './auth/social-user.js';

function buildRedirectUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export {
  buildAuthProviders,
  getSigningSecret,
  kakaoConfigured,
  naverConfigured,
  readSessionUser,
  sha256Base64Url,
};

export function createAuthResponse(sessionUser, env) {
  return {
    isAuthenticated: Boolean(sessionUser),
    user: sessionUser,
    providers: buildAuthProviders(env),
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

export async function handleAuthProviders(request, env) {
  return jsonResponse(200, buildAuthProviders(env), env, request);
}

export async function handleAuthSession(request, env) {
  return jsonResponse(200, createAuthResponse(await readSessionUser(request, env), env), env, request);
}

export async function handleLogout(request, env) {
  return jsonResponse(200, createAuthResponse(null, env), env, request, {
    'set-cookie': 'jamissue_worker_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
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
  await supabaseRequest(env, `user?user_id=eq.${encodeURIComponent(sessionResult.sessionUser.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      nickname,
      profile_completed_at: sessionResult.sessionUser.profileCompletedAt ?? nowIso,
      updated_at: nowIso,
    }),
  });

  const userRow = await readUserRow(env, sessionResult.sessionUser.id);
  const nextSessionUser = {
    ...sessionResult.sessionUser,
    nickname: userRow?.nickname ?? nickname,
    email: userRow?.email ?? sessionResult.sessionUser.email,
    profileCompletedAt: userRow?.profile_completed_at ?? sessionResult.sessionUser.profileCompletedAt ?? nowIso,
  };
  const sessionCookie = await issueSessionCookie(nextSessionUser, request, env);
  return jsonResponse(200, createAuthResponse(nextSessionUser, env), env, request, {
    'set-cookie': sessionCookie,
  });
}

async function buildStateLoginResponse(request, env, url, buildLoginUrl) {
  const next = url.searchParams.get('next') || env.APP_FRONTEND_URL || 'https://daejeon.jamissue.com';
  const state = crypto.randomUUID().replace(/-/g, '');
  const stateCookie = await createOAuthStateCookie(next, state, request, env);
  return redirectResponse(buildLoginUrl(env, state), env, request, [stateCookie]);
}

export async function handleStartNaverLogin(request, env, url) {
  if (!naverConfigured(env)) {
    return jsonResponse(503, { detail: '네이버 로그인이 아직 설정되지 않았어요.' }, env, request);
  }
  return buildStateLoginResponse(request, env, url, buildNaverLoginUrl);
}

export async function handleStartKakaoLogin(request, env, url) {
  if (!kakaoConfigured(env)) {
    return jsonResponse(503, { detail: '카카오 로그인이 아직 설정되지 않았어요.' }, env, request);
  }
  return buildStateLoginResponse(request, env, url, buildKakaoLoginUrl);
}

function buildCallbackContext(request, env, statePayload) {
  return {
    redirectTarget: statePayload?.next || env.APP_FRONTEND_URL || 'https://daejeon.jamissue.com',
    cleanupCookie: createOAuthCleanupCookie(request, env),
  };
}

async function finishSocialLogin({
  request,
  env,
  url,
  provider,
  exchangeCode,
  fetchProfile,
}) {
  const statePayload = await readOAuthStatePayload(request, env);
  const { redirectTarget, cleanupCookie } = buildCallbackContext(request, env, statePayload);

  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (error) {
    return redirectResponse(
      buildRedirectUrl(redirectTarget, { auth: `${provider}-error`, reason: errorDescription || error }),
      env,
      request,
      [cleanupCookie],
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || !statePayload || statePayload.state !== state || statePayload.exp < nowSeconds()) {
    return redirectResponse(
      buildRedirectUrl(redirectTarget, { auth: `${provider}-error`, reason: 'state-mismatch' }),
      env,
      request,
      [cleanupCookie],
    );
  }

  try {
    const tokenPayload = provider === 'naver'
      ? await exchangeCode(env, code, state)
      : await exchangeCode(env, code);
    const profile = await fetchProfile(tokenPayload.access_token);
    const sessionUser = await upsertSocialUser(env, profile, provider);
    const sessionCookie = await issueSessionCookie(sessionUser, request, env);

    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: `${provider}-success` }), env, request, [
      cleanupCookie,
      sessionCookie,
    ]);
  } catch (errorValue) {
    const reason = errorValue instanceof Error ? errorValue.message : String(errorValue);
    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: `${provider}-error`, reason }), env, request, [cleanupCookie]);
  }
}

export async function handleNaverCallback(request, env, url) {
  return finishSocialLogin({
    request,
    env,
    url,
    provider: 'naver',
    exchangeCode: exchangeNaverCode,
    fetchProfile: fetchNaverProfile,
  });
}

export async function handleKakaoCallback(request, env, url) {
  return finishSocialLogin({
    request,
    env,
    url,
    provider: 'kakao',
    exchangeCode: exchangeKakaoCode,
    fetchProfile: fetchKakaoProfile,
  });
}
