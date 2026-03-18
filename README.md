# JamIssue

대전 관광을 `지도 -> 스탬프 -> 피드 -> 코스` 흐름으로 이어가는 모바일 우선 서비스입니다.

현재 운영 배포는 `Cloudflare Pages + Cloudflare Worker + Supabase` 조합을 사용합니다.  
팀 레퍼런스 아키텍처는 별도로 `FastAPI + SQLAlchemy` 축을 유지합니다.

## 현재 기준

- 프론트 도메인: `https://jamissue.growgardens.app`
- API 도메인: `https://api.jamissue.growgardens.app`
- Pages 프로젝트: `jamissue-web`
- Worker 프로젝트: `jamissue-api`
- 작업 브랜치 기준: `codex/production-deploy`

## 핵심 제품 규칙

### 1. 화면 구조
- 하단 탭은 `지도 / 피드 / 코스 / 마이`
- `지도` 탭만 지도와 바텀 드로워를 사용
- `피드 / 코스 / 마이`는 지도 배경을 공유하지 않는 별도 페이지형 레이아웃

### 2. 스탬프는 방문 로그
- `user_stamp` 는 단순 보유 여부가 아니라 방문 로그
- 같은 장소라도 날짜가 다르면 다시 적립 가능
- 같은 날짜에는 같은 장소 스탬프를 한 번만 적립
- `visit_ordinal` 로 `n번째 방문`을 표시

### 3. 후기 작성은 방문 증명 필수
- 후기 작성에는 반드시 `stamp_id` 가 필요
- 단순히 GPS 반경 안에 들어왔다고 후기 작성이 열리지 않음
- 프론트에서 비활성화하고, API에서 다시 검증

### 4. 코스는 travel session 기반
- 스탬프 간격이 24시간 이내면 같은 `travel_session`
- 24시간을 넘기면 새 세션으로 분리
- 사용자 생성 코스는 `travel_session_id` 기준으로 발행
- 정렬은 `popular` / `latest`

### 5. 계정과 로그인 수단 분리
- 내부 사용자 식별자는 `user.user_id`
- 네이버/카카오 같은 외부 로그인 식별자는 `user_identity`
- 같은 이메일 자동 병합 금지
- 닉네임 중복 허용

## 현재 Worker가 직접 처리하는 API

- `GET /api/health`
- `GET /api/auth/providers`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/naver/login`
- `GET /api/auth/naver/callback`
- `GET /api/bootstrap`
- `GET /api/reviews`
- `POST /api/reviews/upload`
- `POST /api/reviews`
- `GET /api/reviews/:reviewId/comments`
- `POST /api/reviews/:reviewId/comments`
- `POST /api/reviews/:reviewId/like`
- `POST /api/stamps/toggle`
- `GET /api/community-routes`
- `POST /api/community-routes`
- `POST /api/community-routes/:routeId/like`
- `GET /api/my/routes`
- `GET /api/my/summary`
- `GET /api/banner/events`
- `GET /api/festivals`

## Supabase 적용 순서

### 신규 프로젝트
SQL Editor에서 아래 순서대로 실행합니다.

1. [supabase_schema.sql](/D:/Code305/JamIssue/backend/sql/supabase_schema.sql)
2. [supabase_storage.sql](/D:/Code305/JamIssue/backend/sql/supabase_storage.sql)
3. [20260318_seed_daejeon_places_50.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_seed_daejeon_places_50.sql)
4. [20260318_seed_daejeon_activity.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_seed_daejeon_activity.sql)
5. [20260318_normalize_place_categories.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_normalize_place_categories.sql)

## Cloudflare Pages 값

위치: `Workers & Pages -> jamissue-web -> Settings -> Environment variables`

```env
PUBLIC_APP_BASE_URL=https://api.jamissue.growgardens.app
PUBLIC_NAVER_MAP_CLIENT_ID=<NAVER_DYNAMIC_MAP_CLIENT_ID>
```

- `PUBLIC_APP_BASE_URL`: 프론트가 호출할 API 주소
- `PUBLIC_NAVER_MAP_CLIENT_ID`: 네이버 지도 Dynamic Map Client ID

## Cloudflare Worker Variables

위치: `Workers & Pages -> jamissue-api -> Settings -> Variables and Secrets -> Variables`

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

위치: `Workers & Pages -> jamissue-api -> Settings -> Variables and Secrets -> Secrets`

```env
APP_SESSION_SECRET=<랜덤 64자 이상>
APP_JWT_SECRET=<랜덤 64자 이상>
APP_DATABASE_URL=postgres://postgres.<project-ref>:<DB_PASSWORD>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
APP_SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
APP_NAVER_LOGIN_CLIENT_ID=<NAVER_LOGIN_CLIENT_ID>
APP_NAVER_LOGIN_CLIENT_SECRET=<NAVER_LOGIN_CLIENT_SECRET>
APP_PUBLIC_EVENT_SERVICE_KEY=<DATA_GO_KR_SERVICE_KEY>
```

## 네이버 개발자센터 설정

- 서비스 URL: `https://jamissue.growgardens.app`
- Callback URL: `https://api.jamissue.growgardens.app/api/auth/naver/callback`

## 로컬 검증 명령

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
- [docs/worker-first-poc.md](/D:/Code305/JamIssue/docs/worker-first-poc.md)
- [docs/growgardens-deploy-runbook.md](/D:/Code305/JamIssue/docs/growgardens-deploy-runbook.md)

