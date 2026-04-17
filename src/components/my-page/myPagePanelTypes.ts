import type {
  AdminSummaryResponse,
  AuthProvider,
  MyPageResponse,
  MyPageTabKey,
  ReviewMood,
  SessionUser,
} from '../../types';

export interface MyPagePanelProps {
  sessionData: {
    sessionUser: SessionUser | null;
    myPage: MyPageResponse | null;
    providers: AuthProvider[];
    myPageError: string | null;
  };
  panelState: {
    activeTab: MyPageTabKey;
    isLoggingOut: boolean;
    profileSaving: boolean;
    profileError: string | null;
    routeSubmitting: boolean;
    routeError: string | null;
    commentsHasMore: boolean;
    commentsLoadingMore: boolean;
  };
  reviewActions: {
    onOpenPlace: (placeId: string) => void;
    onOpenComment: (reviewId: string, commentId: string) => void;
    onOpenRoute: (routeId: string) => Promise<void>;
    onOpenReview: (reviewId: string) => void;
    onUpdateReview: (reviewId: string, payload: { body: string; mood: ReviewMood; file?: File | null; removeImage?: boolean }) => Promise<void>;
    onDeleteReview: (reviewId: string) => Promise<void>;
    onLoadMoreComments: (initial?: boolean) => Promise<void>;
  };
  panelActions: {
    onChangeTab: (nextTab: MyPageTabKey) => void;
    onLogin: (provider: 'naver' | 'kakao') => void;
    onRetry: () => Promise<void>;
    onLogout: () => Promise<void>;
    onSaveNickname: (nickname: string) => Promise<void>;
    onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => Promise<void>;
  };
  adminData: {
    adminSummary: AdminSummaryResponse | null;
    adminBusyPlaceId: string | null;
    adminLoading: boolean;
  };
  adminActions: {
    onRefreshAdmin: () => Promise<void>;
    onToggleAdminPlace: (placeId: string, nextValue: boolean) => Promise<void>;
    onToggleAdminManualOverride: (placeId: string, nextValue: boolean) => Promise<void>;
  };
}
