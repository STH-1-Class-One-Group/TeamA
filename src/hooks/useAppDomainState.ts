import { useAuthDomainState } from './useAuthDomainState';
import { useMapDomainState } from './useMapDomainState';
import { useMyPageDomainState } from './useMyPageDomainState';
import { useReturnViewDomainState } from './useReturnViewDomainState';
import { useReviewDomainState } from './useReviewDomainState';

export function useAppDomainState() {
  const myPageState = useMyPageDomainState();
  const reviewState = useReviewDomainState();
  const mapState = useMapDomainState();
  const returnViewState = useReturnViewDomainState();
  const authState = useAuthDomainState();

  return {
    ...myPageState,
    ...reviewState,
    ...mapState,
    ...returnViewState,
    ...authState,
  };
}
