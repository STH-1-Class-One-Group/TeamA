export function getSelectionVerticalOffset(mapElement: HTMLDivElement | null, targetType: 'place' | 'festival') {
  const mapHeight = mapElement?.clientHeight ?? 0;
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 640;
  if (mapHeight <= 0) {
    if (targetType === 'place') {
      return isMobileViewport ? 360 : 250;
    }
    return isMobileViewport ? 280 : 190;
  }

  const ratio = targetType === 'place'
    ? (isMobileViewport ? 0.56 : 0.38)
    : (isMobileViewport ? 0.42 : 0.29);
  const minOffset = targetType === 'place'
    ? (isMobileViewport ? 340 : 240)
    : (isMobileViewport ? 260 : 170);
  const maxOffset = targetType === 'place'
    ? (isMobileViewport ? 430 : 310)
    : (isMobileViewport ? 330 : 230);
  return Math.min(maxOffset, Math.max(minOffset, Math.round(mapHeight * ratio)));
}
