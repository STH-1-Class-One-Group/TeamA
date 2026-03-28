import type {
  Comment,
  MyComment,
  MyPageResponse,
  Place,
  Review,
  SessionUser,
  StampLog,
  TravelSession,
  UserRoute,
} from '../../src/types';

export const sessionUserFixture: SessionUser = {
  id: 'user-1',
  nickname: '테스터',
  email: 'tester@example.com',
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: '2026-03-28T10:00:00.000Z',
};

export const placeFixture: Place = {
  id: 'place-1',
  positionId: 'position-1',
  name: '슬리피타운',
  district: '서구',
  category: 'cafe',
  jamColor: '#ff7fab',
  accentColor: '#7cb9d1',
  imageUrl: 'https://example.com/place.jpg',
  latitude: 36.3504,
  longitude: 127.3845,
  summary: '대전 카페 동선을 천천히 잇기 좋은 곳이에요.',
  description: '차분한 분위기와 넓은 좌석이 있는 카페입니다.',
  vibeTags: ['친구랑', '조용한'],
  visitTime: '오후',
  routeHint: '정문에서 오른쪽 골목으로 들어오면 바로 보여요.',
  stampReward: '카페 스탬프',
  heroLabel: 'PLACE',
  totalVisitCount: 12,
};

export const commentFixture: Comment = {
  id: 'comment-1',
  userId: 'user-2',
  author: '댓글러',
  body: '분위기 진짜 좋아 보여요.',
  parentId: null,
  isDeleted: false,
  createdAt: '03. 28. 09:10',
  replies: [],
};

export function createReviewFixture(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    userId: 'user-1',
    placeId: placeFixture.id,
    placeName: placeFixture.name,
    author: '킴노현',
    body: '두 번째 방문 했어요. 밤 분위기가 더 좋아서 다시 가도 만족스러웠어요.',
    mood: '친구랑',
    badge: '친구 추천',
    visitedAt: '03. 27. 12:31',
    imageUrl: 'https://example.com/review.jpg',
    commentCount: 1,
    likeCount: 2,
    likedByMe: true,
    stampId: 'stamp-1',
    visitNumber: 2,
    visitLabel: '2번째 방문',
    travelSessionId: 'session-1',
    hasPublishedRoute: true,
    comments: [commentFixture],
    ...overrides,
  };
}

export const reviewFixture = createReviewFixture();
export const secondaryReviewFixture = createReviewFixture({
  id: 'review-2',
  body: '낮보다 밤에 더 매력적인 장소였어요.',
  badge: '야경 맛집',
  likedByMe: false,
  likeCount: 0,
  comments: [],
});

export const latestStampFixture: StampLog = {
  id: 'stamp-1',
  placeId: placeFixture.id,
  placeName: placeFixture.name,
  stampedAt: '03. 27. 12:31',
  stampedDate: '2026-03-27',
  visitNumber: 2,
  visitLabel: '2번째 방문',
  travelSessionId: 'session-1',
  travelSessionStampCount: 2,
  isToday: false,
};

export const todayStampFixture: StampLog = {
  ...latestStampFixture,
  id: 'stamp-2',
  stampedAt: '03. 28. 18:42',
  stampedDate: '2026-03-28',
  isToday: true,
};

export const travelSessionFixture: TravelSession = {
  id: 'session-1',
  startedAt: '2026-03-27T10:00:00.000Z',
  endedAt: '2026-03-27T18:00:00.000Z',
  durationLabel: '3월 27일 하루 코스',
  stampCount: 2,
  placeIds: ['place-1', 'place-2'],
  placeNames: ['슬리피타운', '문장카페'],
  canPublish: true,
  publishedRouteId: null,
  coverPlaceId: 'place-1',
};

export const routeFixture: UserRoute = {
  id: 'route-1',
  authorId: 'user-1',
  author: '테스터',
  title: '슬리피타운 밤 산책',
  description: '카페와 야경을 자연스럽게 잇는 동선이에요.',
  mood: '데이트',
  likeCount: 4,
  likedByMe: true,
  createdAt: '03. 28. 19:20',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['슬리피타운', '문장카페'],
  isUserGenerated: true,
  travelSessionId: 'session-1',
};

export const myCommentFixture: MyComment = {
  id: 'my-comment-1',
  reviewId: 'review-1',
  placeId: placeFixture.id,
  placeName: placeFixture.name,
  body: '여긴 밤에 가면 훨씬 분위기 좋아요.',
  isDeleted: false,
  parentId: null,
  createdAt: '03. 27. 18:42',
  reviewBody: '두 번째 방문 했어요. 밤 분위기가 더 좋아서 다시 가도 만족스러웠어요.',
};

export const myPageFixture: MyPageResponse = {
  user: sessionUserFixture,
  stats: {
    reviewCount: 1,
    stampCount: 2,
    uniquePlaceCount: 2,
    totalPlaceCount: 10,
    routeCount: 1,
  },
  reviews: [reviewFixture],
  comments: [myCommentFixture],
  notifications: [],
  unreadNotificationCount: 0,
  stampLogs: [todayStampFixture],
  travelSessions: [travelSessionFixture],
  visitedPlaces: [placeFixture],
  unvisitedPlaces: [],
  collectedPlaces: [placeFixture],
  routes: [routeFixture],
};
