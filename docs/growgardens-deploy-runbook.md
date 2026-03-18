# JamIssue growgardens 배포 런북

기준 브랜치: `codex/production-deploy`

이 문서는 현재 공개 도메인과 배포에 필요한 값, Supabase 적용 순서를 한 곳에 정리한 문서입니다.

## 현재 배포 구조

```text
Frontend
-> Cloudflare Pages (jamissue-web)

API
-> Cloudflare Worker (jamissue-api)
-> Supabase REST / Storage

Optional
-> FastAPI origin
```

## 현재 직접 동작하는 범위

- 네이버 로그인 시작 / callback / 세션 확인
- 장소 / 후기 / 추천 경로 조회
- 후기 이미지 업로드
- 후기 작성 / 댓글 작성 / 후기 좋아요
- 현장 반경 기반 스탬프 적립
- 사용자 생성 경로 작성 / 좋아요
- 축제 데이터 조회

## 아직 직접 안 하는 범위

- 카카오 OAuth 실제 로그인
- 관리자 전용 운영 API
- FastAPI origin fallback이 필요한 선택 기능

## 1. Supabase SQL 적용

### 신규 프로젝트
1. [supabase_schema.sql](/D:/Code305/JamIssue/backend/sql/supabase_schema.sql)
2. [supabase_storage.sql](/D:/Code305/JamIssue/backend/sql/supabase_storage.sql)
3. [20260318_seed_daejeon_places_50.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_seed_daejeon_places_50.sql)
4. [20260318_seed_daejeon_activity.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_seed_daejeon_activity.sql)
5. [20260318_normalize_place_categories.sql](/D:/Code305/JamIssue/backend/sql/migrations/20260318_normalize_place_categories.sql)

## 2. Cloudflare Pages 값

프로젝트: `jamissue-web`  
위치: `Workers & Pages -> jamissue-web -> Settings -> Environment variables`

```env
PUBLIC_APP_BASE_URL=https://api.jamissue.growgardens.app
PUBLIC_NAVER_MAP_CLIENT_ID=<NAVER_DYNAMIC_MAP_CLIENT_ID>
```

- `PUBLIC_APP_BASE_URL`: 프론트가 호출할 API 주소
- `PUBLIC_NAVER_MAP_CLIENT_ID`: 네이버 지도 Dynamic Map Client ID

## 3. Cloudflare Worker Variables

프로젝트: `jamissue-api`  
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

## 4. Cloudflare Worker Secrets

프로젝트: `jamissue-api`  
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

## 5. 네이버 개발자센터 등록 값

- 서비스 URL: `https://jamissue.growgardens.app`
- Callback URL: `https://api.jamissue.growgardens.app/api/auth/naver/callback`

## 6. 확인 주소

- 프론트: `https://jamissue.growgardens.app`
- API: `https://api.jamissue.growgardens.app`
- Worker 기본 주소: `https://jamissue-api.yhh4433.workers.dev`

## 7. 운영 메모

- 카카오는 아직 실제 OAuth 미구현
- 관리자 기능은 별도 백오피스로 분리되지 않음
- `APP_ORIGIN_API_URL` 은 FastAPI origin fallback이 필요할 때만 사용


