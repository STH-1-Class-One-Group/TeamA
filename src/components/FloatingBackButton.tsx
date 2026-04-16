import { useFloatingBackButton } from './floating-back-button/useFloatingBackButton';

interface FloatingBackButtonProps {
  onNavigateBack: () => void;
}

export function FloatingBackButton({ onNavigateBack }: FloatingBackButtonProps) {
  const {
    isDragging,
    style,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
  } = useFloatingBackButton({ onNavigateBack });

  return (
    <button
      type="button"
      className={isDragging ? 'app-back-button is-dragging' : 'app-back-button'}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      aria-label="이전 화면으로 돌아가기"
    >
      <span aria-hidden="true">{'\u2190'}</span>
    </button>
  );
}
