import {
  BUTTON_SIZE,
  DESKTOP_BOTTOM_PADDING,
  EDGE_PADDING,
  MOBILE_SHEET_OFFSET,
} from './constants';

export interface Position {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function getPlacementBounds(): Bounds | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const shell = document.querySelector<HTMLElement>('.phone-shell');
  if (shell) {
    const rect = shell.getBoundingClientRect();
    return {
      minX: rect.left + EDGE_PADDING,
      maxX: rect.right - BUTTON_SIZE - EDGE_PADDING,
      minY: rect.top + EDGE_PADDING,
      maxY: rect.bottom - BUTTON_SIZE - EDGE_PADDING,
    };
  }

  return {
    minX: EDGE_PADDING,
    maxX: Math.max(EDGE_PADDING, window.innerWidth - BUTTON_SIZE - EDGE_PADDING),
    minY: EDGE_PADDING,
    maxY: Math.max(EDGE_PADDING, window.innerHeight - BUTTON_SIZE - DESKTOP_BOTTOM_PADDING),
  };
}

export function clampPosition(position: Position) {
  const bounds = getPlacementBounds();
  if (!bounds) {
    return position;
  }

  return {
    x: Math.min(Math.max(position.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(position.y, bounds.minY), bounds.maxY),
  };
}

export function getDefaultPosition(): Position {
  if (typeof window === 'undefined') {
    return { x: EDGE_PADDING, y: EDGE_PADDING };
  }

  const bounds = getPlacementBounds();
  if (!bounds) {
    return { x: EDGE_PADDING, y: EDGE_PADDING };
  }

  const isMobileViewport = window.innerWidth <= 640;
  return clampPosition({
    x: bounds.maxX,
    y: isMobileViewport ? bounds.maxY - MOBILE_SHEET_OFFSET : bounds.maxY - DESKTOP_BOTTOM_PADDING,
  });
}
