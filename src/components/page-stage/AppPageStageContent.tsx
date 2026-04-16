import { EventTab } from '../EventTab';
import { PageStageCourseView } from './PageStageCourseView';
import { PageStageFeedView } from './PageStageFeedView';
import { PageStageMyView } from './PageStageMyView';
import type { AppPageStageProps } from './appPageStageTypes';

export function AppPageStageContent({
  activeTab,
  sharedData,
  feedData,
  courseData,
  myPageData,
  sharedActions,
  feedActions,
  courseActions,
  myPageActions,
}: AppPageStageProps) {
  if (activeTab === 'feed') {
    return (
      <PageStageFeedView
        sharedData={sharedData}
        feedData={feedData}
        sharedActions={sharedActions}
        feedActions={feedActions}
      />
    );
  }

  if (activeTab === 'event') {
    return <EventTab festivals={sharedData.festivals} />;
  }

  if (activeTab === 'course') {
    return (
      <PageStageCourseView
        sharedData={sharedData}
        courseData={courseData}
        sharedActions={sharedActions}
        courseActions={courseActions}
      />
    );
  }

  return (
    <PageStageMyView
      sharedData={sharedData}
      myPageData={myPageData}
      sharedActions={sharedActions}
      myPageActions={myPageActions}
    />
  );
}
