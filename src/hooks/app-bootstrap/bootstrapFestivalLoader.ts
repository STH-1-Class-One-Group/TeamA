import type * as React from 'react';

import { getFestivals } from '../../api/bootstrapClient';
import type { FestivalItem } from '../../types';
import { resetFestivalSelection } from './bootstrapRuntimeReset';

interface BootstrapFestivalLoaderParams {
  setFestivals: React.Dispatch<React.SetStateAction<FestivalItem[]>>;
  setSelectedFestivalId: (updater: (current: string | null) => string | null) => void;
  isActive: () => boolean;
}

export async function bootstrapFestivalLoader({
  setFestivals,
  setSelectedFestivalId,
  isActive,
}: BootstrapFestivalLoaderParams) {
  const festivalResult = await getFestivals();
  if (!isActive()) {
    return;
  }

  setFestivals(festivalResult);
  resetFestivalSelection(
    festivalResult.map((festival) => festival.id),
    setSelectedFestivalId
  );
}
