# JamIssue

대전 지역의 방문 피드, 스탬프, 코스, 행사 정보를 한 흐름으로 다루는 로컬 가이드 서비스입니다.

- 서비스 주소: [https://daejeon.jamissue.com](https://daejeon.jamissue.com)
- 프론트엔드: Cloudflare Pages
- API: Cloudflare Worker
- 데이터/스토리지: Supabase

## 운영 기준

- 기본 배포 브랜치: `main`
- 프론트 도메인: `https://daejeon.jamissue.com`
- API 도메인: `https://api.daejeon.jamissue.com`
- Pages 프로젝트: `daejeon-jamissue-pages`
- Worker 프로젝트: `daejeon-jamissue-api`

## 배포 흐름

### PR to `main`

- 프론트 검증
  - `npm ci`
  - `npm run typecheck`
  - `npm run build`
- 백엔드 검증
  - `pytest`
- Pages preview 배포
- Worker 배포 검증 (`wrangler deploy --dry-run` 또는 validate-worker)

### Push to `main`

- `ci` 실행
- Pages production 배포
- Worker production 배포
- `production-smoke` 실행
  - 배포 후 공개 API와 프론트 진입 상태를 다시 확인

## 런타임 구조

JamIssue는 Pages + Worker + Supabase 조합을 기본 운영 경계로 사용합니다.

### 진입점

- 사용자는 Pages 프론트엔드에 접속합니다.
- 프론트는 공개 API를 Worker 도메인으로 호출합니다.
- Worker가 공개 API의 기본 진입점입니다.
- FastAPI origin은 보조 origin 역할만 맡습니다.

### 책임 분리

- Pages
  - 정적 프론트 번들 제공
  - 런타임 공개 설정 주입
- Worker
  - 공개 API 진입점
  - 인증, 리뷰/댓글, 스탬프, 코스, 행사, 알림, 마이페이지 처리
  - 필요 시 origin으로 프록시
- FastAPI origin
  - Worker가 아직 직접 처리하지 않는 보조 경로
  - 내부/보조 로직 처리
- Supabase
  - 운영 DB
  - 이미지 스토리지
  - Realtime 기반 알림/동기화 보조

## 운영 스모크 체크

배포 성공만으로 운영 정상 동작으로 보지 않습니다. `production-smoke`가 아래 경로를 다시 확인합니다.

- `GET /api/health`
- `GET /api/auth/providers`
- `GET /api/map-bootstrap`
- `GET /api/review-feed`
- `GET /api/community-routes`
- `GET /api/festivals`

## 지역 행사 동기화

- GitHub Actions: `public-event-sync.yml`
- 기본 실행 시각: 매주 일요일 03:00 KST
- 대전시 공개 행사 데이터를 수집해 DB에 upsert
- 프론트와 API는 원본 사이트를 직접 긁지 않고 저장된 데이터만 조회

## 주요 환경 변수

### GitHub Repository Secrets

위치:
`GitHub > Repository > Settings > Secrets and variables > Actions > Repository secrets`

```env
CLOUDFLARE_API_TOKEN=<Cloudflare API token>
CLOUDFLARE_ACCOUNT_ID=<Cloudflare account id>
EVENT_IMPORT_TOKEN=<random long token>
PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

### GitHub Repository Variables

위치:
`GitHub > Repository > Settings > Secrets and variables > Actions > Repository variables`

```env
PUBLIC_APP_BASE_URL=https://api.daejeon.jamissue.com
PUBLIC_NAVER_MAP_CLIENT_ID=<NAVER_MAP_CLIENT_ID>
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
```

### Cloudflare Worker Variables

```env
APP_ENV=worker-first
APP_SESSION_HTTPS=true
APP_FRONTEND_URL=https://daejeon.jamissue.com
APP_CORS_ORIGINS=https://daejeon.jamissue.com
APP_NAVER_LOGIN_CLIENT_ID=<NAVER_LOGIN_CLIENT_ID>
APP_NAVER_LOGIN_CALLBACK_URL=https://api.daejeon.jamissue.com/api/auth/naver/callback
APP_STORAGE_BACKEND=supabase
APP_SUPABASE_URL=https://<project-ref>.supabase.co
APP_SUPABASE_STORAGE_BUCKET=review-images
APP_STAMP_UNLOCK_RADIUS_METERS=120
```

### Cloudflare Worker Secrets

```env
APP_SESSION_SECRET=<random 64+ chars>
APP_JWT_SECRET=<random 64+ chars>
APP_DATABASE_URL=postgres://postgres.<project-ref>:<DB_PASSWORD>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
APP_SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
APP_NAVER_LOGIN_CLIENT_SECRET=<NAVER_LOGIN_CLIENT_SECRET>
APP_EVENT_IMPORT_TOKEN=<same value as GitHub EVENT_IMPORT_TOKEN>
```

## 로컬 확인 명령

```powershell
cd D:\JamIssue
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
node scripts/sync-daejeon-events.mjs --dry-run
```

```powershell
cd D:\JamIssue\backend
python -m pytest tests
```

## 참고 문서

- [문서 안내](D:/JamIssue/docs/README.md)
- [배포 런북](D:/JamIssue/docs/growgardens-deploy-runbook.md)
- [운영 리팩터링 로드맵](D:/JamIssue/docs/operations-refactor-roadmap.md)
- [백엔드 README](D:/JamIssue/backend/README.md)

## CI 메모

문서만 수정해서 바로 반영할 때는 커밋 메시지에 `[skip ci]`를 포함하면 GitHub Actions를 건너뜁니다.
