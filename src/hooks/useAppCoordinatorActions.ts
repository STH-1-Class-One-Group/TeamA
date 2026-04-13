import { useAppCoordinatorMutationActions } from './useAppCoordinatorMutationActions';
import { useAppCoordinatorStageActions } from './useAppCoordinatorStageActions';
import type {
  DataState,
  DomainState,
  RouteState,
  ShellRuntimeState,
} from './useAppShellCoordinator.types';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';

type CoordinatorActionsArgs = {
  routeState: RouteState;
  domainState: DomainState;
  shellRuntimeState: ShellRuntimeState;
  dataState: DataState;
  services: ReturnType<typeof useAppCoordinatorServices>;
};

export function useAppCoordinatorActions({
  routeState,
  domainState,
  shellRuntimeState,
  dataState,
  services,
}: CoordinatorActionsArgs) {
  const mutationActions = useAppCoordinatorMutationActions({
    routeState,
    domainState,
    shellRuntimeState,
    dataState,
    services,
  });

  const stageActions = useAppCoordinatorStageActions({
    routeState,
    domainState,
    dataState,
    services,
    refreshCurrentPosition: mutationActions.refreshCurrentPosition,
  });

  return {
    handleClaimStamp: mutationActions.handleClaimStamp,
    reviewActions: mutationActions.reviewActions,
    routeActions: mutationActions.routeActions,
    adminActions: mutationActions.adminActions,
    shellNavigation: stageActions.shellNavigation,
    mapStageActions: stageActions.mapStageActions,
    pageStageActions: stageActions.pageStageActions,
  };
}
