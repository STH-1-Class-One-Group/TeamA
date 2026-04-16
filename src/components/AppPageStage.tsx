import { memo } from 'react';
import { AppPageStageContent } from './page-stage/AppPageStageContent';
import type { AppPageStageProps } from './page-stage/appPageStageTypes';

export const AppPageStage = memo(function AppPageStage(props: AppPageStageProps) {
  return (
    <div className="page-stage">
      <AppPageStageContent {...props} />
    </div>
  );
});
