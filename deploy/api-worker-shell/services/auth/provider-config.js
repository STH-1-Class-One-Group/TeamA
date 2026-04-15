export const PROVIDERS = [
  { key: 'naver', label: '네이버' },
  { key: 'kakao', label: '카카오' },
];

export function naverConfigured(env) {
  return Boolean(env.APP_NAVER_LOGIN_CLIENT_ID && env.APP_NAVER_LOGIN_CLIENT_SECRET && env.APP_NAVER_LOGIN_CALLBACK_URL);
}

export function kakaoConfigured(env) {
  return Boolean(env.APP_KAKAO_LOGIN_CLIENT_ID && env.APP_KAKAO_LOGIN_CLIENT_SECRET && env.APP_KAKAO_LOGIN_CALLBACK_URL);
}

export function buildAuthProviders(env) {
  return PROVIDERS.map((provider) => {
    const isEnabled = provider.key === 'naver' ? naverConfigured(env) : kakaoConfigured(env);
    return {
      key: provider.key,
      label: provider.label,
      isEnabled,
      loginUrl: isEnabled ? `/api/auth/${provider.key}/login` : null,
    };
  });
}
