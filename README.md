# JamIssue

JamIssue는 대전 장소를 지도에서 탐색하고, 스탬프를 찍은 뒤 피드와 코스로 이어지는 흐름을 제공하는 앱입니다.

현재 운영 기준 구조는 다음과 같습니다.
- 프론트: Cloudflare Pages `jamissue-web`
- API: Cloudflare Worker `jamissue-api`
- 데이터/스토리지: Supabase
- 기준 브랜치: `codex/production-deploy`

## 현재 구현 범위

- 하단 탭 `지도 / 피드 / 코스 / 마이`
- 지도 탭 장소/축제 마커 및 바텀시트 상세
- 스탬프 로그 기반 반복 방문 기록
- `stamp_id` 기반 방문 증명 후기 작성 제한
- 24시간 기준 `travel_session` 코스 묶음
- 피드 좋아요/댓글, 코스 좋아요
- 마이페이지 탭
  - 얻은 스탬프
  - 내가 쓴 피드
  - 내가 쓴 댓글
  - 생성한 코스
- 네이버 로그인 및 닉네임 수정
- 닉네임 유니크 정책

## Worker에서 직접 처리하는 API

- `GET /api/health`
- `GET /api/auth/providers`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `PATCH /api/auth/profile`
- `GET /api/auth/naver/login`
- `GET /api/auth/naver/callback`
- `GET /api/bootstrap`
- `GET /api/map-bootstrap`
- `GET /api/reviews`
- `POST /api/reviews/upload`
- `POST /api/reviews`
- `GET /api/reviews/:reviewId/comments`
- `POST /api/reviews/:reviewId/comments`
- `POST /api/reviews/:reviewId/like`
- `POST /api/stamps/toggle`
- `GET /api/courses/curated`
- `GET /api/community-routes`
- `POST /api/community-routes`
- `POST /api/community-routes/:routeId/like`
- `GET /api/my/routes`
- `GET /api/my/summary`
- `GET /api/banner/events`
- `GET /api/festivals`

## Supabase SQL 적용 순서

신규 프로젝트 기준 SQL 실행 순서는 아래와 같습니다.

1. [supabase_schema.sql](/D:/Code305/JamIssue/backend/sql/supabase_schema.sql)
2. [supabase_storage.sql](/D:/Code305/JamIssue/backend/sql/supabase_storage.sql)
3. [20260318_seed_daejeon_places_50.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_seed_daejeon_places_50.sql)
4. [20260318_seed_daejeon_activity.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_seed_daejeon_activity.sql)
5. [20260318_normalize_place_categories.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_normalize_place_categories.sql)
6. [20260319_map_image_and_unique_nickname.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260319_map_image_and_unique_nickname.sql)

## Cloudflare Pages 환경변수

프로젝트: `jamissue-web`

```env
PUBLIC_APP_BASE_URL=https://api.jamissue.growgardens.app
PUBLIC_NAVER_MAP_CLIENT_ID=<NAVER_DYNAMIC_MAP_CLIENT_ID>
```

## Cloudflare Worker Variables

프로젝트: `jamissue-api`

```env
APP_ENV=worker-first
APP_SESSION_HTTPS=true
APP_FRONTEND_URL=https://jamissue.growgardens.app
APP_CORS_ORIGINS=https://jamissue.growgardens.app
APP_NAVER_LOGIN_CALLBACK_URL=https://api.jamissue.growgardens.app/api/auth/naver/callback
APP_STORAGE_BACKEND=supabase
APP_SUPABASE_URL=https://ifofgcaqrgtiurzqhiyy.supabase.co
APP_SUPABASE_STORAGE_BUCKET=review-images
APP_STAMP_UNLOCK_RADIUS_METERS=120
APP_PUBLIC_EVENT_SOURCE_URL=https://api.data.go.kr/openapi/tn_pubr_public_cltur_fstvl_api
APP_ORIGIN_API_URL=
```

## Cloudflare Worker Secrets

```env
APP_SESSION_SECRET=<랜덤 64자 이상 문자열>
APP_JWT_SECRET=<랜덤 64자 이상 문자열>
APP_DATABASE_URL=postgres://postgres.<project-ref>:<DB_PASSWORD>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
APP_SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
APP_NAVER_LOGIN_CLIENT_ID=<NAVER_LOGIN_CLIENT_ID>
APP_NAVER_LOGIN_CLIENT_SECRET=<NAVER_LOGIN_CLIENT_SECRET>
APP_PUBLIC_EVENT_SERVICE_KEY=<DATA_GO_KR_SERVICE_KEY>
```

## 네이버 개발자센터 설정

- 서비스 URL: `https://jamissue.growgardens.app`
- Callback URL: `https://api.jamissue.growgardens.app/api/auth/naver/callback`

## 검증 명령

```powershell
cd D:/Code305/JamIssue
npm.cmd run typecheck
npm.cmd run build
```

```powershell
cd D:/Code305/JamIssue/backend
.\.venv\Scripts\python.exe -m pytest tests
```

## 문서

- [docs/README.md](/D:/Code305/JamIssue/docs/README.md)
- [docs/prd-compliance.md](/D:/Code305/JamIssue/docs/prd-compliance.md)
- [docs/screen-spec.md](/D:/Code305/JamIssue/docs/screen-spec.md)
- [docs/community-routes.md](/D:/Code305/JamIssue/docs/community-routes.md)
- [docs/account-identity-schema.md](/D:/Code305/JamIssue/docs/account-identity-schema.md)
- [docs/growgardens-deploy-runbook.md](/D:/Code305/JamIssue/docs/growgardens-deploy-runbook.md)
