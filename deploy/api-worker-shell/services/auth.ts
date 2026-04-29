import { jsonResponse, redirectResponse } from '../lib/http';
import { supabaseRequest } from '../lib/supabase';
import type { AuthProviderKey, WorkerEnv, WorkerSessionUser } from '../types';
import { buildKakaoLoginUrl, exchangeKakaoCode, fetchKakaoProfile } from './auth/kakao-provider';
import { buildNaverLoginUrl, exchangeNaverCode, fetchNaverProfile } from './auth/naver-provider';
import { buildAuthProviders, kakaoConfigured, naverConfigured } from './auth/provider-config';
import {
  createOAuthCleanupCookie,
  createOAuthStateCookie,
  createSessionCleanupCookie,
  getSigningSecret,
  isMissingSigningSecretError,
  issueSessionCookie,
  nowSeconds,
  readOAuthStatePayload,
  readSessionUser,
  requireSessionUser,
  sha256Base64Url,
} from './auth/session';
import { ensureUniqueNickname, readUserRow, upsertSocialUser } from './auth/social-user';

const SESSION_SECRET_UNCONFIGURED_DETAIL = '세션 비밀키가 설정되지 않았어요.';

function buildRedirectUrl(baseUrl: string, params: Record<string, string | null | undefined> = {}) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function sessionSecretUnavailableResponse(request: Request, env: WorkerEnv, extraHeaders: HeadersInit = {}) {
  return jsonResponse(503, { detail: SESSION_SECRET_UNCONFIGURED_DETAIL }, env, request, extraHeaders);
}

export { buildAuthProviders, getSigningSecret, kakaoConfigured, naverConfigured, readSessionUser, sha256Base64Url };

export function createAuthResponse(sessionUser: WorkerSessionUser | null, env: WorkerEnv) {
  return {
    isAuthenticated: Boolean(sessionUser),
    user: sessionUser,
    providers: buildAuthProviders(env),
  };
}

async function readJsonBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

export async function handleAuthProviders(request: Request, env: WorkerEnv) {
  return jsonResponse(200, buildAuthProviders(env), env, request);
}

export async function handleAuthSession(request: Request, env: WorkerEnv) {
  return jsonResponse(200, createAuthResponse(await readSessionUser(request, env), env), env, request);
}

export async function handleLogout(request: Request, env: WorkerEnv) {
  return jsonResponse(200, createAuthResponse(null, env), env, request, {
    'set-cookie': createSessionCleanupCookie(request, env),
  });
}

export async function handleUpdateProfile(request: Request, env: WorkerEnv) {
  const sessionResult = await requireSessionUser(request, env);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const payload = await readJsonBody(request);
  let nickname;
  try {
    nickname = await ensureUniqueNickname(env, payload.nickname, sessionResult.sessionUser.id);
  } catch (error) {
    const profileError = error as { message?: string; status?: number };
    return jsonResponse(
      profileError.status ?? 400,
      { detail: profileError.message ?? '닉네임을 저장할 수 없어요.' },
      env,
      request,
    );
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

  try {
    const sessionCookie = await issueSessionCookie(nextSessionUser, request, env);
    return jsonResponse(200, createAuthResponse(nextSessionUser, env), env, request, {
      'set-cookie': sessionCookie,
    });
  } catch (error) {
    if (isMissingSigningSecretError(error)) {
      return sessionSecretUnavailableResponse(request, env);
    }
    throw error;
  }
}

async function buildStateLoginResponse(
  request: Request,
  env: WorkerEnv,
  url: URL,
  buildLoginUrl: (env: WorkerEnv, state: string) => string,
) {
  const next = url.searchParams.get('next') || env.APP_FRONTEND_URL || 'https://daejeon.jamissue.com';
  const state = crypto.randomUUID().replace(/-/g, '');
  const stateCookie = await createOAuthStateCookie(next, state, request, env);
  return redirectResponse(buildLoginUrl(env, state), env, request, [stateCookie]);
}

async function startSocialLogin(
  request: Request,
  env: WorkerEnv,
  url: URL,
  buildLoginUrl: (env: WorkerEnv, state: string) => string,
) {
  try {
    return await buildStateLoginResponse(request, env, url, buildLoginUrl);
  } catch (error) {
    if (isMissingSigningSecretError(error)) {
      return sessionSecretUnavailableResponse(request, env);
    }
    throw error;
  }
}

export async function handleStartNaverLogin(request: Request, env: WorkerEnv, url: URL) {
  if (!naverConfigured(env)) {
    return jsonResponse(503, { detail: '네이버 로그인이 아직 설정되지 않았어요.' }, env, request);
  }
  return startSocialLogin(request, env, url, buildNaverLoginUrl);
}

export async function handleStartKakaoLogin(request: Request, env: WorkerEnv, url: URL) {
  if (!kakaoConfigured(env)) {
    return jsonResponse(503, { detail: '카카오 로그인이 아직 설정되지 않았어요.' }, env, request);
  }
  return startSocialLogin(request, env, url, buildKakaoLoginUrl);
}

function buildCallbackContext(request: Request, env: WorkerEnv, statePayload: { next?: string } | null) {
  return {
    redirectTarget: statePayload?.next || env.APP_FRONTEND_URL || 'https://daejeon.jamissue.com',
    cleanupCookie: createOAuthCleanupCookie(request, env),
  };
}

interface FinishSocialLoginOptions {
  request: Request;
  env: WorkerEnv;
  url: URL;
  provider: AuthProviderKey;
  exchangeCode: (env: WorkerEnv, code: string, state?: string) => Promise<{ access_token: string }>;
  fetchProfile: (accessToken: string) => Promise<any>;
}

async function finishSocialLogin({ request, env, url, provider, exchangeCode, fetchProfile }: FinishSocialLoginOptions) {
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
    const tokenPayload =
      provider === 'naver' ? await exchangeCode(env, code, state) : await exchangeCode(env, code);
    const profile = await fetchProfile(tokenPayload.access_token);
    const sessionUser = await upsertSocialUser(env, profile, provider);
    const sessionCookie = await issueSessionCookie(sessionUser, request, env);

    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: `${provider}-success` }), env, request, [
      cleanupCookie,
      sessionCookie,
    ]);
  } catch (errorValue) {
    if (isMissingSigningSecretError(errorValue)) {
      return sessionSecretUnavailableResponse(request, env, { 'set-cookie': cleanupCookie });
    }
    const reason = errorValue instanceof Error ? errorValue.message : String(errorValue);
    return redirectResponse(buildRedirectUrl(redirectTarget, { auth: `${provider}-error`, reason }), env, request, [
      cleanupCookie,
    ]);
  }
}

export async function handleNaverCallback(request: Request, env: WorkerEnv, url: URL) {
  return finishSocialLogin({
    request,
    env,
    url,
    provider: 'naver',
    exchangeCode: exchangeNaverCode,
    fetchProfile: fetchNaverProfile,
  });
}

export async function handleKakaoCallback(request: Request, env: WorkerEnv, url: URL) {
  return finishSocialLogin({
    request,
    env,
    url,
    provider: 'kakao',
    exchangeCode: exchangeKakaoCode,
    fetchProfile: fetchKakaoProfile,
  });
}
