import { create } from 'zustand';
import { logout as apiLogout, updateProfile as apiUpdateProfile } from '../api/client';
import type { AuthProvider, SessionUser } from '../types';

const emptyProviders: AuthProvider[] = [
  { key: 'naver', label: '네이버', isEnabled: false, loginUrl: null },
  { key: 'kakao', label: '카카오', isEnabled: false, loginUrl: null },
];

interface AuthState {
  sessionUser: SessionUser | null;
  providers: AuthProvider[];
  isLoggingOut: boolean;
  profileSaving: boolean;
  profileError: string | null;
}

interface AuthActions {
  setSessionUser: (user: SessionUser | null) => void;
  setProviders: (providers: AuthProvider[]) => void;
  setProfileError: (error: string | null) => void;
  logout: () => Promise<string>;
  updateProfile: (nickname: string) => Promise<{ notice: string; user: SessionUser | null }>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  sessionUser: null,
  providers: emptyProviders,
  isLoggingOut: false,
  profileSaving: false,
  profileError: null,

  setSessionUser: (user) => set({ sessionUser: user }),
  setProviders: (providers) => set({ providers }),
  setProfileError: (error) => set({ profileError: error }),

  logout: async () => {
    set({ isLoggingOut: true });
    try {
      const auth = await apiLogout();
      set({ sessionUser: auth.user, providers: auth.providers });
      return '로그아웃했어요.';
    } finally {
      set({ isLoggingOut: false });
    }
  },

  updateProfile: async (nickname: string) => {
    if (!nickname || nickname.length < 2) {
      set({ profileError: '닉네임은 두 글자 이상으로 입력해 주세요.' });
      throw new Error('닉네임은 두 글자 이상으로 입력해 주세요.');
    }
    set({ profileSaving: true, profileError: null });
    try {
      const auth = await apiUpdateProfile({ nickname });
      set({ sessionUser: auth.user });
      return { notice: '닉네임을 저장했어요. 이제 같은 계정으로 기록을 이어볼 수 있어요.', user: auth.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청을 처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
      set({ profileError: message });
      throw error;
    } finally {
      set({ profileSaving: false });
    }
  },
}));
