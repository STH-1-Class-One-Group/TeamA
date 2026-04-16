import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { TOUCH_DRAG_DELAY_MS } from './constants';
import { clampPosition, getDefaultPosition, type Position } from './position';

interface UseFloatingBackButtonParams {
  onNavigateBack: () => void;
}

function clearTouchTimer(timer: React.MutableRefObject<number | null>) {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
    timer.current = null;
  }
}

export function useFloatingBackButton({ onNavigateBack }: UseFloatingBackButtonParams) {
  const [position, setPosition] = useState<Position>(getDefaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const handledTapRef = useRef(false);
  const touchTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    hasMoved: false,
    dragEnabled: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    function handleResize() {
      setPosition((current) => clampPosition(current));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(
    () => () => {
      clearTouchTimer(touchTimerRef);
    },
    [],
  );

  const style = useMemo(
    () => ({ left: position.x, top: position.y, right: 'auto', bottom: 'auto' }),
    [position],
  );

  function finishDrag(pointerId: number) {
    if (dragStateRef.current.pointerId !== pointerId) {
      return;
    }

    clearTouchTimer(touchTimerRef);
    dragStateRef.current.pointerId = -1;
    dragStateRef.current.dragEnabled = false;
    setIsDragging(false);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    handledTapRef.current = false;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      hasMoved: false,
      dragEnabled: event.pointerType === 'mouse',
    };

    if (event.pointerType !== 'mouse') {
      clearTouchTimer(touchTimerRef);
      touchTimerRef.current = window.setTimeout(() => {
        if (dragStateRef.current.pointerId === event.pointerId) {
          dragStateRef.current.dragEnabled = true;
          setIsDragging(true);
        }
      }, TOUCH_DRAG_DELAY_MS);
    } else {
      setIsDragging(true);
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStateRef.current.hasMoved = true;
    }

    if (!dragStateRef.current.dragEnabled) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
    setPosition(
      clampPosition({
        x: dragStateRef.current.originX + deltaX,
        y: dragStateRef.current.originY + deltaY,
      }),
    );
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const shouldNavigate =
      dragStateRef.current.pointerId === event.pointerId &&
      !dragStateRef.current.hasMoved &&
      !dragStateRef.current.dragEnabled;
    finishDrag(event.pointerId);
    if (shouldNavigate) {
      handledTapRef.current = true;
      onNavigateBack();
    }
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    finishDrag(event.pointerId);
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (handledTapRef.current) {
      handledTapRef.current = false;
      event.preventDefault();
      return;
    }

    if (dragStateRef.current.hasMoved || isDragging) {
      event.preventDefault();
      return;
    }

    onNavigateBack();
  }

  return {
    isDragging,
    style,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
  };
}
