import { useAppMapStore } from '../store/app-map-store';

export function useMapDomainState() {
  const activeCategory = useAppMapStore((state) => state.activeCategory);
  const setActiveCategory = useAppMapStore((state) => state.setActiveCategory);
  const selectedRoutePreview = useAppMapStore((state) => state.selectedRoutePreview);
  const setSelectedRoutePreview = useAppMapStore((state) => state.setSelectedRoutePreview);

  return {
    activeCategory,
    setActiveCategory,
    selectedRoutePreview,
    setSelectedRoutePreview,
  };
}
