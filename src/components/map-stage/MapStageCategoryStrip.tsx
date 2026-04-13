import { categoryInfo, categoryItems } from '../../lib/categories';
import type { Category } from '../../types';

type MapStageCategoryStripProps = {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
};

export function MapStageCategoryStrip({
  activeCategory,
  onSelectCategory,
}: MapStageCategoryStripProps) {
  return (
    <div className="map-filter-strip">
      <div className="chip-row compact-gap">
        {categoryItems.map((item) => {
          const isActive = item.key === activeCategory;
          const info = item.key === 'all' ? null : categoryInfo[item.key];
          return (
            <button
              key={item.key}
              type="button"
              className={isActive ? 'chip is-active map-filter-chip' : 'chip map-filter-chip'}
              onClick={() => onSelectCategory(item.key)}
              style={
                info
                  ? {
                      background: isActive ? info.color : 'rgba(255,255,255,0.94)',
                      borderColor: info.jamColor,
                      color: '#4a3140',
                    }
                  : undefined
              }
            >
              {info ? String(info.icon) + ' ' + item.label : item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
