import type { WorkerEnv } from '../../types';

const NAVER_AUTHORIZE_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

interface NaverTokenPayload {
  access_token?: string;
  error?: string;
  error_description?: string;
  message?: string;
}

interface NaverProfilePayload {
  message?: string;
  response?: Record<string, unknown>;
  resultcode?: string;
}

function buildNaverLoginUrl(env: WorkerEnv, state: string) {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: env.APP_NAVER_LOGIN_CLIENT_ID ?? '',
    redirect_uri: env.APP_NAVER_LOGIN_CALLBACK_URL ?? '',
    state,
  });
  return `${NAVER_AUTHORIZE_URL}?${query.toString()}`;
}

async function exchangeNaverCode(env: WorkerEnv, code: string, state: string) {
  const query = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.APP_NAVER_LOGIN_CLIENT_ID ?? '',
    client_secret: env.APP_NAVER_LOGIN_CLIENT_SECRET ?? '',
    code,
    state,
  });
  const response = await fetch(`${NAVER_TOKEN_URL}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const payload = (await response.json()) as NaverTokenPayload;
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.message || '네이버 토큰 교환에 실패했어요.');
  }
  return { ...payload, access_token: payload.access_token };
}

async function fetchNaverProfile(accessToken: string) {
  const response = await fetch(NAVER_PROFILE_URL, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = (await response.json()) as NaverProfilePayload;
  if (!response.ok || payload.resultcode !== '00' || !payload.response) {
    throw new Error(payload.message || '네이버 사용자 정보를 가져오지 못했어요.');
  }
  return payload.response;
}

export { buildNaverLoginUrl, exchangeNaverCode, fetchNaverProfile };
