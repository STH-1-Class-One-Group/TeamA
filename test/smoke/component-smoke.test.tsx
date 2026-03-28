import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyPagePanel } from '../../src/components/MyPagePanel';
import { PlaceDetailSheet } from '../../src/components/PlaceDetailSheet';
import { ReviewList } from '../../src/components/ReviewList';
import {
  latestStampFixture,
  myPageFixture,
  placeFixture,
  reviewFixture,
  sessionUserFixture,
} from '../fixtures/app-fixtures';

describe('component smoke', () => {
  it('renders the major refactored surfaces without crashing', () => {
    const reviewList = render(
      <ReviewList
        reviews={[reviewFixture]}
        canWriteComment={true}
        canToggleLike={true}
        currentUserId="user-1"
        highlightedReviewId={null}
        likingReviewId={null}
        submittingReviewId={null}
        onToggleLike={vi.fn().mockResolvedValue(undefined)}
        onSubmitComment={vi.fn().mockResolvedValue(undefined)}
        onUpdateComment={vi.fn().mockResolvedValue(undefined)}
        onDeleteComment={vi.fn().mockResolvedValue(undefined)}
        onRequestLogin={vi.fn()}
        onOpenPlace={vi.fn()}
        onOpenComments={vi.fn()}
        emptyTitle="비어 있음"
        emptyBody="내용 없음"
      />,
    );

    const placeSheet = render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture]}
        isOpen={true}
        drawerState="partial"
        loggedIn={true}
        visitCount={2}
        latestStamp={latestStampFixture}
        todayStamp={null}
        hasCreatedReviewToday={false}
        stampActionStatus="ready"
        stampActionMessage="오늘 방문 인증을 완료할 수 있어요."
        reviewProofMessage="방문 후 피드를 작성해 주세요."
        reviewError={null}
        reviewSubmitting={false}
        canCreateReview={false}
        onOpenFeedReview={vi.fn()}
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onRequestLogin={vi.fn()}
        onClaimStamp={vi.fn().mockResolvedValue(undefined)}
        onCreateReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const myPage = render(
      <MyPagePanel
        sessionUser={sessionUserFixture}
        myPage={myPageFixture}
        providers={[]}
        myPageError={null}
        activeTab="feeds"
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

    expect(reviewList.container.firstChild).not.toBeNull();
    expect(placeSheet.container.firstChild).not.toBeNull();
    expect(myPage.container.firstChild).not.toBeNull();
  });
});
