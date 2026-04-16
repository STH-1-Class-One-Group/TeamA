import { FestivalDetailSheet } from '../FestivalDetailSheet';
import { PlaceDetailSheet } from '../PlaceDetailSheet';
import type { MapTabStageProps } from './mapTabStageTypes';

interface MapStageSheetsProps {
  placeSheet: MapTabStageProps['placeSheet'];
  festivalSheet: MapTabStageProps['festivalSheet'];
}

export function MapStageSheets({ placeSheet, festivalSheet }: MapStageSheetsProps) {
  return (
    <>
      <PlaceDetailSheet
        place={placeSheet.selectedPlace}
        reviews={placeSheet.selectedPlaceReviews}
        isOpen={Boolean(placeSheet.selectedPlace) && placeSheet.drawerState !== 'closed'}
        drawerState={placeSheet.drawerState}
        loggedIn={Boolean(placeSheet.sessionUser)}
        visitCount={placeSheet.visitCount}
        latestStamp={placeSheet.latestStamp}
        todayStamp={placeSheet.todayStamp}
        hasCreatedReviewToday={placeSheet.hasCreatedReviewToday}
        stampActionStatus={placeSheet.stampActionStatus}
        stampActionMessage={placeSheet.stampActionMessage}
        reviewProofMessage={placeSheet.reviewProofMessage}
        reviewError={placeSheet.reviewError}
        reviewSubmitting={placeSheet.reviewSubmitting}
        canCreateReview={placeSheet.canCreateReview}
        onOpenFeedReview={placeSheet.onOpenFeedReview}
        onClose={placeSheet.onCloseDrawer}
        onExpand={placeSheet.onExpandPlaceDrawer}
        onCollapse={placeSheet.onCollapsePlaceDrawer}
        onRequestLogin={placeSheet.onRequestLogin}
        onClaimStamp={placeSheet.onClaimStamp}
        onCreateReview={placeSheet.onCreateReview}
      />

      <FestivalDetailSheet
        festival={festivalSheet.selectedFestival}
        isOpen={Boolean(festivalSheet.selectedFestival) && festivalSheet.drawerState !== 'closed'}
        drawerState={festivalSheet.drawerState}
        onClose={festivalSheet.onCloseDrawer}
        onExpand={festivalSheet.onExpandFestivalDrawer}
        onCollapse={festivalSheet.onCollapseFestivalDrawer}
      />
    </>
  );
}
