import type { SessionUser } from '../../types';

const PROFILE_COMPLETION_NOTICE =
  '프로필을 먼저 완성하면 같은 계정으로 스탬프와 리뷰를 이어서 남길 수 있어요.';

interface HandleBootstrapAuthNoticeParams {
  authState: string | null;
  user: SessionUser | null;
  goToTab: (tab: 'my', historyMode?: 'push' | 'replace') => void;
  setNotice: (message: string | null) => void;
}

export function handleBootstrapAuthNotice({
  authState,
  user,
  goToTab,
  setNotice,
}: HandleBootstrapAuthNoticeParams) {
  if ((authState === 'naver-success' || authState === 'kakao-success') && user?.profileCompletedAt === null) {
    goToTab('my');
    setNotice(PROFILE_COMPLETION_NOTICE);
  }
}
