import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReviewList } from '../../src/components/ReviewList';
import { reviewFixture } from '../fixtures/app-fixtures';

describe('ReviewList regression', () => {
  it('preserves highlighted feed card structure and action wiring after refactor', () => {
    const onToggleLike = vi.fn().mockResolvedValue(undefined);
    const onOpenPlace = vi.fn();
    const onOpenComments = vi.fn();

    const { container, getByRole } = render(
      <ReviewList
        reviews={[reviewFixture]}
        canWriteComment={true}
        canToggleLike={true}
        currentUserId="user-1"
        highlightedReviewId={reviewFixture.id}
        likingReviewId={null}
        submittingReviewId={null}
        onToggleLike={onToggleLike}
        onSubmitComment={vi.fn().mockResolvedValue(undefined)}
        onUpdateComment={vi.fn().mockResolvedValue(undefined)}
        onDeleteComment={vi.fn().mockResolvedValue(undefined)}
        onRequestLogin={vi.fn()}
        onOpenPlace={onOpenPlace}
        onOpenComments={onOpenComments}
        emptyTitle="비어 있음"
        emptyBody="내용 없음"
      />,
    );

    const article = container.querySelector(`[data-review-id="${reviewFixture.id}"]`);
    expect(article).toHaveClass('review-card--highlighted');
    expect(article).toHaveClass('review-card--feed');

    fireEvent.click(getByRole('button', { name: String(reviewFixture.likeCount) }));
    expect(onToggleLike).toHaveBeenCalledWith(reviewFixture.id);

    fireEvent.click(getByRole('button', { name: `댓글 ${reviewFixture.comments.length}개` }));
    expect(onOpenComments).toHaveBeenCalledWith(reviewFixture.id);

    fireEvent.click(getByRole('button', { name: '이 장소 보기' }));
    expect(onOpenPlace).toHaveBeenCalledWith(reviewFixture.placeId);
  });
});
