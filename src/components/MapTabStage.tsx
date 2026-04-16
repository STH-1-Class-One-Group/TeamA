import { MapStageBrandHeader } from './map-stage/MapStageBrandHeader';
import { MapStageCategoryStrip } from './map-stage/MapStageCategoryStrip';
import { MapStageMapSurface } from './map-stage/MapStageMapSurface';
import { MapStageSheets } from './map-stage/MapStageSheets';
import type { MapTabStageProps } from './map-stage/mapTabStageTypes';

export function MapTabStage({
  mapData,
  routePreviewData,
  viewportData,
  placeSheet,
  festivalSheet,
  mapActions,
}: MapTabStageProps) {
  return (
    <div className="map-stage">
      <MapStageBrandHeader />
      <MapStageCategoryStrip
        activeCategory={mapData.activeCategory}
        onSelectCategory={mapActions.setActiveCategory}
      />
      <MapStageMapSurface
        mapData={mapData}
        routePreviewData={routePreviewData}
        viewportData={viewportData}
        placeSheet={placeSheet}
        festivalSheet={festivalSheet}
      />
      <MapStageSheets placeSheet={placeSheet} festivalSheet={festivalSheet} />
    </div>
  );
}
