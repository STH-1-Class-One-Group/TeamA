export type AuthProviderKey = 'naver' | 'kakao';

export interface WorkerEnv {
  APP_ADMIN_USER_IDS?: string;
  APP_CORS_ORIGINS?: string;
  APP_ENV?: string;
  APP_EVENT_IMPORT_TOKEN?: string;
  APP_FRONTEND_URL?: string;
  APP_JWT_SECRET?: string;
  APP_KAKAO_LOGIN_CALLBACK_URL?: string;
  APP_KAKAO_LOGIN_CLIENT_ID?: string;
  APP_KAKAO_LOGIN_CLIENT_SECRET?: string;
  APP_NAVER_LOGIN_CALLBACK_URL?: string;
  APP_NAVER_LOGIN_CLIENT_ID?: string;
  APP_NAVER_LOGIN_CLIENT_SECRET?: string;
  APP_ORIGIN_API_URL?: string;
  APP_PUBLIC_EVENT_CITY_KEYWORD?: string;
  APP_SESSION_HTTPS?: string;
  APP_SESSION_SECRET?: string;
  APP_STORAGE_BACKEND?: string;
  APP_SUPABASE_ANON_KEY?: string;
  APP_SUPABASE_SERVICE_ROLE_KEY?: string;
  APP_SUPABASE_STORAGE_BUCKET?: string;
  APP_SUPABASE_URL?: string;
  [key: string]: unknown;
}

export interface WorkerSessionUser {
  id: string;
  nickname: string;
  email: string | null;
  provider: string;
  profileImage: string | null;
  isAdmin: boolean;
  profileCompletedAt: string | null;
}

export interface SupabaseRequestOptions extends RequestInit {
  headers?: HeadersInit;
  body?: BodyInit | null;
}

export interface SupabaseIdentityRow {
  identity_id: string | number;
  user_id: string;
  email?: string | null;
  profile_image?: string | null;
}

export interface SupabaseUserRow {
  user_id: string;
  nickname?: string | null;
  email?: string | null;
  provider?: string | null;
  profile_completed_at?: string | null;
}
