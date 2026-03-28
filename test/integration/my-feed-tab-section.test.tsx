import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyFeedTabSection } from '../../src/components/my-page/MyFeedTabSection';
import { reviewFixture } from '../fixtures/app-fixtures';

describe('MyFeedTabSection integration', () => {
  it('opens edit mode and submits updated review content', async () => {
    const onUpdateReview = vi.fn().mockResolvedValue(undefined);

    render(
      <MyFeedTabSection
        reviews={[reviewFixture]}
        onOpenPlace={vi.fn()}
        onOpenReview={vi.fn()}
        onUpdateReview={onUpdateReview}
        onDeleteReview={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '  수정된 피드 내용입니다.  ' } });

    fireEvent.click(screen.getByRole('button', { name: '수정 저장' }));

    expect(onUpdateReview).toHaveBeenCalledWith(reviewFixture.id, {
      body: '수정된 피드 내용입니다.',
      mood: reviewFixture.mood,
      file: null,
      removeImage: false,
    });
  });
});
