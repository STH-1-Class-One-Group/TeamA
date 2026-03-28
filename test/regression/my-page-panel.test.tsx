import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyPagePanel } from '../../src/components/MyPagePanel';
import { myPageFixture, sessionUserFixture } from '../fixtures/app-fixtures';
import type { MyPageTabKey } from '../../src/types';

function renderPanel(activeTab: MyPageTabKey) {
  return render(
    <MyPagePanel
      sessionUser={sessionUserFixture}
      myPage={myPageFixture}
      providers={[]}
      myPageError={null}
      activeTab={activeTab}
      isLoggingOut={false}
      profileSaving={false}
      profileError={null}
      routeSubmitting={false}
      routeError={null}
      adminSummary={null}
      adminBusyPlaceId={null}
      adminLoading={false}
      onChangeTab={vi.fn()}
      onLogin={vi.fn()}
      onRetry={vi.fn().mockResolvedValue(undefined)}
      onLogout={vi.fn().mockResolvedValue(undefined)}
      onSaveNickname={vi.fn().mockResolvedValue(undefined)}
      onPublishRoute={vi.fn().mockResolvedValue(undefined)}
      onOpenPlace={vi.fn()}
      onOpenComment={vi.fn()}
      onOpenReview={vi.fn()}
      onUpdateReview={vi.fn().mockResolvedValue(undefined)}
      onDeleteReview={vi.fn().mockResolvedValue(undefined)}
      onMarkNotificationRead={vi.fn().mockResolvedValue(undefined)}
      onMarkAllNotificationsRead={vi.fn().mockResolvedValue(undefined)}
      onDeleteNotification={vi.fn().mockResolvedValue(undefined)}
      commentsHasMore={false}
      commentsLoadingMore={false}
      onLoadMoreComments={vi.fn().mockResolvedValue(undefined)}
      onRefreshAdmin={vi.fn().mockResolvedValue(undefined)}
      onToggleAdminPlace={vi.fn().mockResolvedValue(undefined)}
      onToggleAdminManualOverride={vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

describe('MyPagePanel regression', () => {
  it('renders the extracted tab sections without losing their representative content', () => {
    const { rerender } = renderPanel('stamps');
    expect(screen.getByText('STAMP LOG')).toBeInTheDocument();

    rerender(
      <MyPagePanel
        sessionUser={sessionUserFixture}
        myPage={myPageFixture}
        providers={[]}
        myPageError={null}
        activeTab="comments"
        isLoggingOut={false}
        profileSaving={false}
        profileError={null}
        routeSubmitting={false}
        routeError={null}
        adminSummary={null}
        adminBusyPlaceId={null}
        adminLoading={false}
        onChangeTab={vi.fn()}
        onLogin={vi.fn()}
        onRetry={vi.fn().mockResolvedValue(undefined)}
        onLogout={vi.fn().mockResolvedValue(undefined)}
        onSaveNickname={vi.fn().mockResolvedValue(undefined)}
        onPublishRoute={vi.fn().mockResolvedValue(undefined)}
        onOpenPlace={vi.fn()}
        onOpenComment={vi.fn()}
        onOpenReview={vi.fn()}
        onUpdateReview={vi.fn().mockResolvedValue(undefined)}
        onDeleteReview={vi.fn().mockResolvedValue(undefined)}
        onMarkNotificationRead={vi.fn().mockResolvedValue(undefined)}
        onMarkAllNotificationsRead={vi.fn().mockResolvedValue(undefined)}
        onDeleteNotification={vi.fn().mockResolvedValue(undefined)}
        commentsHasMore={false}
        commentsLoadingMore={false}
        onLoadMoreComments={vi.fn().mockResolvedValue(undefined)}
        onRefreshAdmin={vi.fn().mockResolvedValue(undefined)}
        onToggleAdminPlace={vi.fn().mockResolvedValue(undefined)}
        onToggleAdminManualOverride={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText('내 댓글')).toBeInTheDocument();

    rerender(
      <MyPagePanel
        sessionUser={sessionUserFixture}
        myPage={myPageFixture}
        providers={[]}
        myPageError={null}
        activeTab="routes"
        isLoggingOut={false}
        profileSaving={false}
        profileError={null}
        routeSubmitting={false}
        routeError={null}
        adminSummary={null}
        adminBusyPlaceId={null}
        adminLoading={false}
        onChangeTab={vi.fn()}
        onLogin={vi.fn()}
        onRetry={vi.fn().mockResolvedValue(undefined)}
        onLogout={vi.fn().mockResolvedValue(undefined)}
        onSaveNickname={vi.fn().mockResolvedValue(undefined)}
        onPublishRoute={vi.fn().mockResolvedValue(undefined)}
        onOpenPlace={vi.fn()}
        onOpenComment={vi.fn()}
        onOpenReview={vi.fn()}
        onUpdateReview={vi.fn().mockResolvedValue(undefined)}
        onDeleteReview={vi.fn().mockResolvedValue(undefined)}
        onMarkNotificationRead={vi.fn().mockResolvedValue(undefined)}
        onMarkAllNotificationsRead={vi.fn().mockResolvedValue(undefined)}
        onDeleteNotification={vi.fn().mockResolvedValue(undefined)}
        commentsHasMore={false}
        commentsLoadingMore={false}
        onLoadMoreComments={vi.fn().mockResolvedValue(undefined)}
        onRefreshAdmin={vi.fn().mockResolvedValue(undefined)}
        onToggleAdminPlace={vi.fn().mockResolvedValue(undefined)}
        onToggleAdminManualOverride={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText(myPageFixture.routes[0].title)).toBeInTheDocument();
  });
});
