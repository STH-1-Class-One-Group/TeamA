export const categoryInfo = {
  restaurant: {
    name: '맛집',
    color: '#FFB3C6',
    icon: '🍞',
    jamColor: '#FF6B9D',
  },
  cafe: {
    name: '카페',
    color: '#A8D5E2',
    icon: '☕',
    jamColor: '#7CB9D1',
  },
  attraction: {
    name: '명소',
    color: '#FFD4E0',
    icon: '🌸',
    jamColor: '#FFB3C6',
  },
  culture: {
    name: '문화',
    color: '#C9E4EA',
    icon: '🎨',
    jamColor: '#A8D5E2',
  },
} as const;

export type PlaceCategory = keyof typeof categoryInfo;
export type PlaceCategoryFilter = 'all' | PlaceCategory;

const cultureSlugHints = [
  'museum',
  'arts-center',
  'art-science',
  'science-museum',
  'observatory',
];

export function normalizePlaceCategory(category: string, slug = ''): PlaceCategory {
  if (category === 'restaurant' || category === 'cafe' || category === 'attraction' || category === 'culture') {
    return category;
  }

  if (category === 'food') {
    return 'restaurant';
  }

  if (category === 'night') {
    return 'attraction';
  }

  if (category === 'landmark') {
    return cultureSlugHints.some((hint) => slug.includes(hint)) ? 'culture' : 'attraction';
  }

  return 'attraction';
}

export const categoryItems: { key: PlaceCategoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'restaurant', label: categoryInfo.restaurant.name },
  { key: 'cafe', label: categoryInfo.cafe.name },
  { key: 'attraction', label: categoryInfo.attraction.name },
  { key: 'culture', label: categoryInfo.culture.name },
];
