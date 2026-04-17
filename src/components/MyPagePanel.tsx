import { useEffect, useMemo, useState } from 'react';
import { useAutoLoadMore } from '../hooks/useAutoLoadMore';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { MyPageAccountSection } from './my-page/MyPageAccountSection';
import { MyPageGuestState } from './my-page/MyPageGuestState';
import { MyPageHeader } from './my-page/MyPageHeader';
import { MyPageLoadError } from './my-page/MyPageLoadError';
import { MyPageOverviewSection } from './my-page/MyPageOverviewSection';
import { MyPageSettingsSection } from './my-page/MyPageSettingsSection';
import { MyPageTabContent } from './my-page/MyPageTabContent';
import type { MyPagePanelProps } from './my-page/myPagePanelTypes';

export function MyPagePanel({
  sessionData,
  panelState,
  reviewActions,
  panelActions,
  adminData,
  adminActions,
}: MyPagePanelProps) {
  const { sessionUser, myPage, providers, myPageError } = sessionData;
  const {
    activeTab,
    isLoggingOut,
    profileSaving,
    profileError,
    routeSubmitting,
    routeError,
    commentsHasMore,
    commentsLoadingMore,
  } = panelState;
  const {
    onOpenPlace,
    onOpenComment,
    onOpenRoute,
    onOpenReview,
    onUpdateReview,
    onDeleteReview,
    onLoadMoreComments,
  } = reviewActions;
  const {
    onChangeTab,
    onLogin,
    onRetry,
    onLogout,
    onSaveNickname,
    onPublishRoute,
  } = panelActions;
  const { adminSummary, adminBusyPlaceId, adminLoading } = adminData;
  const {
    onRefreshAdmin,
    onToggleAdminPlace,
    onToggleAdminManualOverride,
  } = adminActions;
  const [nickname, setNickname] = useState(sessionUser?.nickname ?? '');
  const [showVisitedDetail, setShowVisitedDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useScrollRestoration<HTMLElement>('my');
  const commentsLoadMoreRef = useAutoLoadMore({
    enabled: activeTab === 'comments' && commentsHasMore,
    loading: commentsLoadingMore,
    onLoadMore: () => onLoadMoreComments(),
    rootRef: scrollRef,
  });

  useEffect(() => {
    setNickname(sessionUser?.nickname ?? '');
    if (sessionUser && !sessionUser.profileCompletedAt) {
      setShowSettings(true);
    }
  }, [sessionUser?.nickname, sessionUser?.profileCompletedAt]);

  const visitPct = useMemo(
    () => (myPage && myPage.stats.totalPlaceCount > 0
      ? Math.round((myPage.stats.uniquePlaceCount / myPage.stats.totalPlaceCount) * 100)
      : 0),
    [myPage],
  );

  async function handleNicknameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSaveNickname(nickname.trim());
    setShowSettings(false);
  }

  if (!sessionUser) {
    return (
      <section ref={scrollRef} className="page-panel page-panel--scrollable">
        <MyPageGuestState providers={providers} onLogin={onLogin} />
      </section>
    );
  }

  return (
    <section ref={scrollRef} className="page-panel page-panel--scrollable">
      <MyPageHeader sessionUser={sessionUser} />

      {!myPage && myPageError && <MyPageLoadError myPageError={myPageError} onRetry={onRetry} />}

      <MyPageAccountSection
        sessionUser={sessionUser}
        isLoggingOut={isLoggingOut}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((current) => !current)}
        onLogout={() => void onLogout()}
      />

      <MyPageSettingsSection
        nickname={nickname}
        showSettings={showSettings}
        profileCompletedAt={sessionUser.profileCompletedAt}
        profileSaving={profileSaving}
        profileError={profileError}
        onNicknameChange={setNickname}
        onClose={() => setShowSettings(false)}
        onSubmit={handleNicknameSubmit}
      />

      {myPage && (
        <>
          <MyPageOverviewSection
            uniquePlaceCount={myPage.stats.uniquePlaceCount}
            totalPlaceCount={myPage.stats.totalPlaceCount}
            stampCount={myPage.stats.stampCount}
            visitPct={visitPct}
            visitedPlaces={myPage.visitedPlaces}
            unvisitedPlaces={myPage.unvisitedPlaces}
            showVisitedDetail={showVisitedDetail}
            onToggleVisitedDetail={() => setShowVisitedDetail((current) => !current)}
            onOpenPlace={onOpenPlace}
            travelSessions={myPage.travelSessions}
          />

          <MyPageTabContent
            activeTab={activeTab}
            sessionUser={sessionUser}
            myPage={myPage}
            commentsHasMore={commentsHasMore}
            commentsLoadingMore={commentsLoadingMore}
            commentsLoadMoreRef={commentsLoadMoreRef}
            routeSubmitting={routeSubmitting}
            routeError={routeError}
            adminSummary={adminSummary}
            adminBusyPlaceId={adminBusyPlaceId}
            adminLoading={adminLoading}
            onChangeTab={onChangeTab}
            onOpenPlace={onOpenPlace}
            onOpenComment={onOpenComment}
            onOpenRoute={onOpenRoute}
            onOpenReview={onOpenReview}
            onUpdateReview={onUpdateReview}
            onDeleteReview={onDeleteReview}
            onPublishRoute={onPublishRoute}
            onRefreshAdmin={onRefreshAdmin}
            onToggleAdminPlace={onToggleAdminPlace}
            onToggleAdminManualOverride={onToggleAdminManualOverride}
          />
        </>
      )}
    </section>
  );
}
