import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaceDetailSheet } from '../../src/components/PlaceDetailSheet';
import {
  latestStampFixture,
  placeFixture,
  reviewFixture,
  secondaryReviewFixture,
  todayStampFixture,
} from '../fixtures/app-fixtures';

describe('PlaceDetailSheet integration', () => {
  it('wires close, proof, and feed preview actions without losing visible content', () => {
    const onClose = vi.fn();
    const onClaimStamp = vi.fn().mockResolvedValue(undefined);
    const onOpenFeedReview = vi.fn();

    render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture, secondaryReviewFixture]}
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
        onOpenFeedReview={onOpenFeedReview}
        onClose={onClose}
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onRequestLogin={vi.fn()}
        onClaimStamp={onClaimStamp}
        onCreateReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText(placeFixture.name)).toBeInTheDocument();
    expect(screen.getByText(placeFixture.summary)).toBeInTheDocument();
    expect(screen.getAllByText('2번째 방문').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '오늘 스탬프 찍기' }));
    expect(onClaimStamp).toHaveBeenCalledWith(placeFixture);

    fireEvent.click(screen.getByRole('button', { name: '피드에서 보기' }));
    expect(onOpenFeedReview).toHaveBeenCalledTimes(1);
  });

  it('shows completed proof state when today stamp already exists', () => {
    render(
      <PlaceDetailSheet
        place={placeFixture}
        reviews={[reviewFixture]}
        isOpen={true}
        drawerState="full"
        loggedIn={true}
        visitCount={2}
        latestStamp={todayStampFixture}
        todayStamp={todayStampFixture}
        hasCreatedReviewToday={true}
        stampActionStatus="ready"
        stampActionMessage="오늘 스탬프를 이미 찍었어요."
        reviewProofMessage="오늘은 이미 피드를 남겼어요."
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

    expect(screen.getByRole('button', { name: '오늘 스탬프 완료' })).toBeDisabled();
  });
});
