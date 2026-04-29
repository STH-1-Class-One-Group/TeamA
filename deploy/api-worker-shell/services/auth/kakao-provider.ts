import type { WorkerEnv } from '../../types';

const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

interface KakaoTokenPayload {
  access_token?: string;
  error?: string;
  error_description?: string;
  message?: string;
}

interface KakaoProfilePayload {
  id?: string | number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
  message?: string;
  msg?: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
}

function buildKakaoLoginUrl(env: WorkerEnv, state: string) {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: env.APP_KAKAO_LOGIN_CLIENT_ID ?? '',
    redirect_uri: env.APP_KAKAO_LOGIN_CALLBACK_URL ?? '',
    state,
  });
  return `${KAKAO_AUTHORIZE_URL}?${query.toString()}`;
}

async function exchangeKakaoCode(env: WorkerEnv, code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.APP_KAKAO_LOGIN_CLIENT_ID ?? '',
    client_secret: env.APP_KAKAO_LOGIN_CLIENT_SECRET ?? '',
    redirect_uri: env.APP_KAKAO_LOGIN_CALLBACK_URL ?? '',
    code,
  });
  const response = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: body.toString(),
  });
  const payload = (await response.json()) as KakaoTokenPayload;
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.message || '카카오 토큰 교환에 실패했어요.');
  }
  return { ...payload, access_token: payload.access_token };
}

async function fetchKakaoProfile(accessToken: string) {
  const response = await fetch(KAKAO_PROFILE_URL, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });
  const payload = (await response.json()) as KakaoProfilePayload;
  if (!response.ok || !payload.id) {
    throw new Error(payload.msg || payload.message || '카카오 사용자 정보를 가져오지 못했어요.');
  }
  return {
    id: String(payload.id),
    nickname: payload.properties?.nickname ?? payload.kakao_account?.profile?.nickname ?? '',
    email: payload.kakao_account?.email ?? null,
    profile_image: payload.properties?.profile_image ?? payload.kakao_account?.profile?.profile_image_url ?? null,
  };
}

export { buildKakaoLoginUrl, exchangeKakaoCode, fetchKakaoProfile };
