type SetProviders = (
  providers: Array<{ key: 'naver' | 'kakao'; label: string; isEnabled: boolean; loginUrl: string | null }>
) => void;

interface ResetBootstrapRuntimeParams {
  setFeedNextCursor: (cursor: string | null) => void;
  setFeedHasMore: (value: boolean) => void;
  setFeedLoadingMore: (value: boolean) => void;
  setMyCommentsNextCursor: (cursor: string | null) => void;
  setMyCommentsHasMore: (value: boolean) => void;
  setMyCommentsLoadingMore: (value: boolean) => void;
  setMyCommentsLoadedOnce: (value: boolean) => void;
  setProviders: SetProviders;
}

export function resetBootstrapRuntime({
  setFeedNextCursor,
  setFeedHasMore,
  setFeedLoadingMore,
  setMyCommentsNextCursor,
  setMyCommentsHasMore,
  setMyCommentsLoadingMore,
  setMyCommentsLoadedOnce,
  setProviders,
}: ResetBootstrapRuntimeParams) {
  setFeedNextCursor(null);
  setFeedHasMore(false);
  setFeedLoadingMore(false);
  setMyCommentsNextCursor(null);
  setMyCommentsHasMore(false);
  setMyCommentsLoadingMore(false);
  setMyCommentsLoadedOnce(false);
  setProviders([]);
}

interface ApplyBootstrapSelectionsParams {
  placeIds: string[];
  setSelectedPlaceId: (updater: (current: string | null) => string | null) => void;
  setSelectedFestivalId: (updater: (current: string | null) => string | null) => void;
}

export function applyBootstrapSelections({
  placeIds,
  setSelectedPlaceId,
  setSelectedFestivalId,
}: ApplyBootstrapSelectionsParams) {
  setSelectedPlaceId((current) => (current && placeIds.includes(current) ? current : null));
  setSelectedFestivalId(() => null);
}

export function resetFestivalSelection(
  festivalIds: string[],
  setSelectedFestivalId: (updater: (current: string | null) => string | null) => void
) {
  setSelectedFestivalId((current) => (current && festivalIds.includes(current) ? current : null));
}
