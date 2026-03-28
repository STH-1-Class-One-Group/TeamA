import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaceProofCard } from '../../src/components/place/PlaceProofCard';

describe('PlaceProofCard', () => {
  it('renders login CTA for logged-out users', () => {
    const onRequestLogin = vi.fn();

    render(
      <PlaceProofCard
        loggedIn={false}
        todayStampExists={false}
        canClaimStamp={false}
        stampActionStatus="idle"
        stampActionMessage="로그인 후 시작할 수 있어요."
        onRequestLogin={onRequestLogin}
        onClaimStamp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '로그인하고 시작' }));
    expect(onRequestLogin).toHaveBeenCalledTimes(1);
  });

  it('renders completed state and disables claim while loading', () => {
    const { rerender } = render(
      <PlaceProofCard
        loggedIn={true}
        todayStampExists={false}
        canClaimStamp={true}
        stampActionStatus="loading"
        stampActionMessage="확인 중입니다."
        onRequestLogin={vi.fn()}
        onClaimStamp={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '확인 중' })).toBeDisabled();

    rerender(
      <PlaceProofCard
        loggedIn={true}
        todayStampExists={true}
        canClaimStamp={false}
        stampActionStatus="ready"
        stampActionMessage="오늘 스탬프를 찍었어요."
        onRequestLogin={vi.fn()}
        onClaimStamp={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '오늘 스탬프 완료' })).toBeDisabled();
  });
});
