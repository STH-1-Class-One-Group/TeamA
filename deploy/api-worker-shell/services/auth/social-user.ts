import { encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { SupabaseIdentityRow, SupabaseUserRow, WorkerEnv, WorkerSessionUser } from '../../types';
import { buildSessionUser } from './session';

interface SocialProfile {
  email?: string | null;
  id: string;
  name?: string | null;
  nickname?: string | null;
  profile_image?: string | null;
}

async function findIdentity(env: WorkerEnv, provider: string, providerUserId: string) {
  const rows = await supabaseRequest<SupabaseIdentityRow[]>(
    env,
    `user_identity?select=identity_id,user_id,email,profile_image&provider=eq.${encodeFilterValue(
      provider,
    )}&provider_user_id=eq.${encodeFilterValue(providerUserId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function readUserRow(env: WorkerEnv, userId: string) {
  const rows = await supabaseRequest<SupabaseUserRow[]>(
    env,
    `user?select=user_id,nickname,email,provider,profile_completed_at&user_id=eq.${encodeFilterValue(userId)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function findUserByNickname(env: WorkerEnv, nickname: string, excludeUserId: string | null = null) {
  const normalized = String(nickname ?? '').trim();
  if (!normalized) {
    return null;
  }

  const rows = await supabaseRequest<SupabaseUserRow[]>(env, 'user?select=user_id,nickname');
  return (
    (rows ?? []).find((row) => {
      if (excludeUserId && row.user_id === excludeUserId) {
        return false;
      }
      return String(row.nickname ?? '').toLowerCase() === normalized.toLowerCase();
    }) ?? null
  );
}

async function ensureUniqueNickname(env: WorkerEnv, nickname: string, excludeUserId: string | null = null) {
  const normalized = String(nickname ?? '').trim();
  if (normalized.length < 2) {
    const error: any = new Error('닉네임은 두 글자 이상으로 적어 주세요.');
    error.status = 400;
    throw error;
  }

  const existing = await findUserByNickname(env, normalized, excludeUserId);
  if (existing) {
    const error: any = new Error('이미 사용 중인 닉네임이에요.');
    error.status = 409;
    throw error;
  }

  return normalized;
}

async function buildUniqueSocialNickname(env: WorkerEnv, nickname: string) {
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

async function upsertSocialUser(env: WorkerEnv, profile: SocialProfile, provider: string): Promise<WorkerSessionUser> {
  const fallbackNickname = profile.nickname || profile.name || '이름 없음';
  const nowIso = new Date().toISOString();
  const existingIdentity = await findIdentity(env, provider, profile.id);

  if (existingIdentity) {
    await supabaseRequest(env, `user?user_id=eq.${encodeFilterValue(existingIdentity.user_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        email: profile.email ?? null,
        provider,
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
      provider,
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
      provider,
      profile_completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    }),
  });
  await supabaseRequest(env, 'user_identity', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      provider,
      provider_user_id: profile.id,
      email: profile.email ?? null,
      profile_image: profile.profile_image ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    }),
  });

  return buildSessionUser(userId, safeNickname, profile.email, provider, profile.profile_image, env, null);
}

export { ensureUniqueNickname, findUserByNickname, readUserRow, upsertSocialUser };
