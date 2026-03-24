JamIssue는 대전 지역의 장소를 탐색하고 방문 인증(스탬프)을 통해 피드와 코스를 생성하는 서비스로, **React(Frontend)**, **FastAPI/Cloudflare Worker(Backend)**, **Supabase(DB/Storage)** 기술 스택을 사용하고 있습니다.

---

### 1. 프로젝트 전체 디렉토리 구조

```
JamIssue/
├── backend/                # API 서버 (FastAPI 기반)
│   ├── app/                # 백엔드 핵심 비즈니스 로직
│   ├── data/               # 초기화용 공공데이터 번들
│   ├── sql/                # DB 스키마 및 마이그레이션 SQL
│   └── tests/              # 백엔드 유닛/통합 테스트
├── deploy/                 # Cloudflare 배포 설정 (wrangler.toml 등)
├── docs/                   # 프로젝트 설계 및 운영 문서
├── infra/                  # Docker 및 Nginx 설정 파일
├── scripts/                # 빌드, 데이터 생성, 배포용 스크립트
├── src/                    # 프론트엔드 소스 코드 (React + TypeScript)
│   ├── api/                # API 클라이언트 정의
│   ├── components/         # UI 컴포넌트 (탭별, 기능별)
│   ├── data/               # 정적 데이터 스키마 및 상수
│   ├── hooks/              # 상태 관리 및 비즈니스 로직 훅
│   ├── lib/                # 유틸리티 함수 (카테고리, 위치 정보 등)
│   ├── store/              # Zustand 기반 전역 상태 저장소
│   └── styles/             # CSS 스타일 보정 파일
├── package.json            # 프론트엔드 의존성 및 스크립트
└── README.md               # 프로젝트 개요 및 로드맵
```

---

### 2. 모듈 및 기능별 상세 설명

### **① 프론트엔드 (Frontend - `/src`)**

사용자에게 직접 노출되는 인터페이스와 클라이언트 사이드 로직을 담당합니다.

- **컴포넌트 (`/src/components`)**: 탭 기반 네비게이션 구조를 가집니다.
    - `NaverMap.tsx`: 네이버 지도를 활용한 장소/축제 마커 표시 및 탐색.
    - `PlaceDetailSheet.tsx` & `FestivalDetailSheet.tsx`: 장소나 축제를 눌렀을 때 나타나는 상세 정보 바텀시트.
    - `ReviewComposer.tsx`: 방문 인증(스탬프) 후 후기를 작성하는 인터페이스.
    - `MyRouteBuilder.tsx`: 사용자의 여행 세션을 기반으로 코스를 생성하는 도구.
    - `CommunityRouteSection.tsx`: 사용자들이 공유한 경로 목록을 좋아요순/최신순으로 표시하는 섹션.
    - `ProviderButtons.tsx`: 네이버·카카오 등 소셜 로그인 버튼 목록을 렌더링하는 컴포넌트.
- **상태 관리 (`/src/store`, `/src/hooks`)**:
    - **Zustand**: `app-runtime-store.ts`(서버 데이터·API 상태)와 `app-ui-store.ts`(탭·드로워·선택 상태)로 앱의 런타임 데이터와 UI 상태를 분리하여 관리합니다.
    - **Custom Hooks**: 데이터 로딩(`useAppTabDataLoaders`), 네비게이션(`useAppNavigationActions`), 페이지네이션(`useAppPaginationActions`), 상태 초기화(`useAppDataState`), 파생 상태(`useAppDerivedState`), URL 라우팅(`useAppRouteState`) 등 기능을 분리하여 관리합니다.

### **② 백엔드 (Backend - `/backend`)**

FastAPI 프레임워크를 기반으로 하며, Cloudflare Worker(`jamissue-api`)로의 배포도 고려하여 설계되었습니다.

- **핵심 로직 (`/backend/app`)**:
    - `auth_service.py` & `naver_oauth.py`: 네이버 로그인 및 JWT 기반 인증 처리.
    - `repository.py` & `repository_normalized.py`: 데이터베이스 액세스 계층. `repository.py`는 기본 CRUD 및 거리 계산, `repository_normalized.py`는 도메인 흐름에 최적화된 복합 조회·변경 로직을 담당합니다.
    - `user_routes.py` & `user_routes_normalized.py`: 사용자 생성 경로의 CRUD와 발행 로직(최소 2곳, 최대 6곳 제한 포함).
    - `public_data/`: 공공데이터(장소, 행사 정보 등)를 가져오고, 이를 앱 내부 형식에 맞게 가공(Normalizing)하는 전용 모듈입니다.
    - `public_event_api.py` & `public_event_models.py`: 공공 행사 배너 API 라우터와 응답 Pydantic 모델.
    - `seed.py` & `seed_data.py`: 앱 시작 시 레거시 데모 데이터를 정리하고 기본 장소 데이터를 DB에 채우는 시딩 로직과 하드코딩된 초기 장소 상수를 관리합니다.
- **데이터베이스 (`/backend/sql`)**:
    - 기본 스키마(`supabase_schema.sql`)와 장소 데이터(`migrations/20260323_seed_sample_places.sql`)를 포함하며, 스탬프와 여행 세션 간의 관계를 관리합니다.

### **③ 인프라 및 자동화 (`/infra`, `/scripts`, `/deploy`)**

- **배포**: Cloudflare Pages(프론트)와 Worker(백엔드)를 사용하며, 관련 설정은 `deploy/` 폴더 내 `wrangler.pages.toml`에 정의되어 있습니다. `deploy/api-worker-shell/`에는 Worker 직접 처리 로직이 있습니다.
- **스크립트**:
    - `generate-sample-place-data.mjs`: HTML 소스에서 장소 정보를 파싱해 JSON 및 SQL 마이그레이션 파일을 생성.
    - `upload-sample-place-images.mjs`: 장소 이미지를 Supabase Storage 버킷(`place-images`)에 업로드.
    - `build-frontend.ps1` / `build-frontend.mjs`: Windows PowerShell 환경 및 Node.js 환경에서의 프론트엔드 빌드 스크립트.
    - `install-local-mysql.ps1` / `mysql-local.ps1`: 시스템 전역 설치 없이 `.runtime/mysql` 하위에서 MySQL 8.4 바이너리를 다운로드하고 제어하는 스크립트.
    - `install-local-nginx.ps1`: `infra/nginx/dist`에 Nginx 바이너리를 설치하는 스크립트.
    - `generate_seed_places.ps1`: 카테고리별 기본 설명/태그를 자동 생성해 장소 SQL 시드 파일을 만드는 PowerShell 스크립트.

### **④ 주요 기능 흐름 (Core Flow)**

1. **장소 탐색**: 지도에서 장소를 확인하고, 120m 반경 내 진입 시 스탬프 활성화.
2. **스탬프 & 세션**: 방문 시 `user_stamp` 로그를 생성하며, 24시간 이내의 활동은 하나의 `travel_session`으로 묶임.
3. **피드 작성**: 스탬프 획득이 선행되어야만 후기(이미지 포함) 작성이 가능함.
4. **코스 생성**: 운영자 큐레이션 및 사용자 자신의 여행 세션을 기반으로 경로 발행(최소 2곳, 최대 6곳).

### 3. 문서 가이드 (`/docs`)

개발 및 운영에 필요한 가이드라인이 상세히 기록되어 있습니다.

- `prd-compliance.md`: 기획 대비 실제 구현된 기능 현황.
- `growgardens-deploy-runbook.md`: 환경변수 설정 및 SQL 적용 순서 등 배포 매뉴얼.
- `account-identity-schema.md`: 회원 탈퇴 처리 및 데이터 유지/삭제 정책.
- `code-flow-diagrams.md`: Mermaid 다이어그램으로 Bootstrap, 스탬프, 리뷰, 로그인 등 핵심 호출 흐름을 시각화.
- `community-routes.md`: 사용자 생성 여행 경로의 정책 및 `travel_session` 기반 코스 발행 로직.
- `data-operations-runbook.md`: 장소 데이터 추가·수정·이미지 교체·공공데이터 동기화 절차.
- `screen-spec.md`: UI 구조, 드로워 상태(`closed/partial/full`), 버튼 활성화 조건 등 QA 체크리스트.
- `search-recommendation-scope.md`: 검색 v1 범위 기준(장소·코스 자유 텍스트 검색, 댓글·행사 제외 등).
- `worker-first-poc.md`: Cloudflare Worker에서 네이버 로그인, 후기/댓글/좋아요/스탬프 쓰기까지 직접 처리하는 POC 설계 문서.

---

### 4. `backend/` 디렉토리 개요

`backend/`는 FastAPI를 기반으로 구축된 API 서버의 모든 로직을 담고 있습니다.

### 5. `backend/app/` 패키지: 백엔드 핵심 비즈니스 로직

### **(1) 설정 및 인프라 모듈**

- **`config.py`**: Pydantic `BaseSettings`로 환경 변수(`.env`)를 관리. DB URL 정규화, CORS, JWT 비밀키, 업로드 경로 등 모든 상숫값을 중앙 집중식으로 관리합니다.
- **`db.py`**: SQLAlchemy 엔진 생성 및 데이터베이스 세션 헬퍼 함수. SQLite 외래 키 활성화 및 커넥션 풀링 옵션을 제어합니다.
- **`jwt_auth.py`**: JWT 발급 및 검증. 사용자 세션 정보를 쿠키(`jamissue_access_token`)에 저장하거나 읽어옵니다.
- **`storage.py`**: 사용자 업로드 이미지를 처리하는 어댑터 패턴 모듈. 로컬 파일 시스템 또는 Supabase Storage 중 하나를 선택할 수 있으며, 파일 크기·형식 유효성 검사도 수행합니다.

### **(2) 데이터 모델링 모듈**

- **`db_models.py`**: SQLAlchemy ORM 모델. `User`, `MapPlace`, `Feed`, `UserStamp`, `TravelSession`, `UserRoute`, `UserIdentity` 등 핵심 도메인 간의 관계(Relationship)와 제약 조건을 명시합니다.
- **`models.py`**: Pydantic API 모델. 요청 데이터의 형식을 검증하고 응답 데이터의 필드를 필터링하여 보안과 데이터 일관성을 유지합니다.

### **(3) 데이터 접근 계층**

- **`repository.py`**: 기본 CRUD와 거리 계산, 닉네임 중복 체크, 댓글 트리 구조 생성 등 도메인 특화 기능을 포함하는 하위 레벨 DB 접근 로직입니다.
- **`repository_normalized.py`**: 도메인 흐름에 최적화된 복합 조회·변경 로직입니다. Bootstrap 응답 조합, 스탬프 처리, 관리자 기능, 공공데이터 임포트 등을 담당합니다.
- **`repository_support.py`**: 두 지점 간 거리 계산(Haversine), KST 시간대 변환, 무드별 배지 매핑 등 공통 헬퍼 유틸리티입니다.
- **`naver_oauth.py`**: 네이버 소셜 로그인 OAuth 2.0 연동. 인증 코드 교환 및 사용자 프로필 조회를 수행합니다.

### **(4) 사용자 경로 모듈**

- **`user_routes.py`**: 사용자 생성 경로의 CRUD 및 비즈니스 규칙(최소 2곳, 최대 6곳, 중복 장소 제거)을 처리합니다.
- **`user_routes_normalized.py`**: `travel_session` 기반으로 사용자 경로를 발행·조회하는 로직입니다. 세션을 자동으로 코스로 변환하는 흐름을 지원합니다.

### **(5) 공공 행사 배너 모듈**

- **`public_event_api.py`**: `/api/banner/events` 엔드포인트를 정의하는 FastAPI 라우터입니다.
- **`public_event_models.py`**: 배너 카드(`PublicEventBannerItem`)와 응답(`PublicEventBannerResponse`) Pydantic 모델입니다.

### **(6) 시딩(Seeding) 모듈**

- **`seed.py`**: 앱 최초 구동 시 레거시 데모 데이터를 정리(`cleanup_legacy_demo_data` 옵션)하고, 장소 데이터가 없으면 공공 번들을 자동 임포트합니다.
- **`seed_data.py`**: 한밭수목원, 엑스포다리 등 초기 서비스 장소 데이터를 Python 상수(`PLACE_SEEDS`)로 정의합니다. 각 장소의 위경도, 카테고리, 잼 컬러, 스탬프 보상 등 메타 정보를 포함합니다.

### **(7) 서비스 계층 (`services/` 디렉토리)**

- **`auth_service.py`**: 로그인/로그아웃 처리 및 프로필 업데이트 시 세션 갱신 비즈니스 로직.
- **`page_service.py`**: 장소 목록, 코스 정보, 마이페이지 요약 등 화면 구성에 필요한 데이터를 조합하여 제공합니다.
- **`review_service.py`**: 후기(Review)와 댓글의 생성, 삭제, 좋아요 토글 등 커뮤니티 활동 로직.
- **`route_service.py`**: 사용자 생성 여행 경로의 공유 및 관리 기능.
- **`account_service.py`**: 회원 탈퇴 등 계정 자체에 대한 민감한 작업 처리.
- **`admin_service.py`**: 관리자 전용 기능. 전체 시스템 지표 조회(`get_admin_summary`), 장소 노출 상태 변경(`update_place_visibility`), 공공데이터 임포트(`import_public_bundle`) 래퍼를 제공합니다.
- **`upload_service.py`**: 후기 이미지 업로드 처리. `storage.py`의 어댑터를 활용해 파일을 저장하고 `UploadResponse`를 반환합니다.

### **(8) 애플리케이션 엔트리포인트**

- **`main.py`**: FastAPI 인스턴스를 생성하고 CORS/세션 미들웨어, 예외 처리기, 각 기능별 API 라우트를 등록하여 서비스를 외부에 노출합니다.

### 6. `backend/app/public_data/` : 공공데이터 동기화 모듈

외부 공공데이터를 가져와 앱 내부 형식으로 정규화하는 전용 하위 패키지입니다.

- **`client.py`**: `public_bundle.json` 파일을 로드하여 `PublicDataBundle` 구조로 반환합니다.
- **`schemas.py`**: 공공데이터 번들(`PublicDataBundle`, `PublicSourcePayload`)의 Pydantic 스키마를 정의합니다.
- **`normalizer.py`**: 공공데이터 포털 장소 항목을 앱의 `MapPlace` 모델에 맞게 정규화합니다.
- **`service.py`**: 공공 관광 데이터를 DB에 업서트(upsert)하고, 기존 매핑을 갱신하는 동기화 로직을 담당합니다.
- **`event_client.py`**: 공공 행사 API를 호출하거나 기본 페이로드를 반환하는 클라이언트입니다.
- **`event_schemas.py`**: 공공 행사 API 응답의 Pydantic 스키마를 정의합니다.
- **`event_normalizer.py`**: 공공 행사 API 응답을 앱 내부 `PublicEvent` 모델로 정규화합니다.
- **`event_service.py`**: 공공 행사 데이터를 DB에 적재하고, 배너 응답(`PublicEventBannerResponse`)을 조합하여 반환합니다.

### 7. `backend/data/` : 초기화 및 외부 공공데이터 번들

- **`public_bundle.json`**: 대전 지역의 장소(Place) 및 코스(Course) 정보를 담고 있는 핵심 데이터 파일입니다. 서버 시작 시 `seed.py` 로직을 통해 이 파일의 내용이 데이터베이스에 반영(Seeding)되어 서비스의 기본 콘텐츠를 구성합니다.

### 8. `backend/sql/` : 데이터베이스 스키마 및 마이그레이션

- **`schema.sql`**: 전체 데이터베이스 테이블 구조가 정의된 마스터 스크립트.
- **`supabase_schema.sql` / `supabase_storage.sql`**: Supabase 환경에 특화된 테이블 구조 및 스토리지 정책(RLS 등) 설정 스크립트.
- **`migrations/`**: 기능 추가나 버그 수정에 따른 DB 변경 이력을 순차적으로 관리합니다.
    - **좌표 및 데이터 수정**: 칼국수, 한밭수목원 등 특정 장소의 오기입된 좌표를 바로잡는 스크립트.
    - **기능 확장**: 스탬프 세션 리팩토링, 닉네임 유니크 제약 조건 추가, 이미지 저장 경로 컬럼 추가, `is_manual_override` 플래그 추가 등.
    - **샘플 데이터 주입**: 테스트 및 데모를 위해 50개 이상의 대전 장소 데이터를 한꺼번에 주입하는 시드 스크립트.

### 9. `backend/tests/` : 유닛 및 통합 테스트

- **`test_config_db.py`**: 환경 설정값 로드 및 데이터베이스 엔진 생성 검증.
- **`test_jwt_auth.py`**: 토큰 발급, 만료 처리, 페이로드 복원 로직 테스트.
- **`test_repository.py` / `test_user_routes.py`**: 실제 DB 연동 CRUD 및 사용자 경로 비즈니스 규칙 검증.
- **`test_public_data_service.py` / `test_public_event_service.py`**: 공공데이터 정규화 서비스 로직 검증.
- **`test_storage.py`**: 파일 업로드 및 스토리지 어댑터(로컬/Supabase) 테스트.

### 10. `backend/` 루트 파일들

- **`Dockerfile`**: Python 환경 구축 및 의존성 설치 과정을 자동화하는 백엔드 컨테이너화 명세.
- **`run_appserver.py`**: Uvicorn을 이용해 FastAPI 앱을 즉시 실행하는 로컬 개발용 진입점 스크립트.
- **`requirements.local.txt`**: 로컬 개발 환경 Python 패키지 의존성 목록.

### 11. `deploy/` : Cloudflare 배포 설정

- **`wrangler.pages.toml`**: Cloudflare Pages 프로젝트 배포 설정 파일.
- **`api-worker-shell/`**: Cloudflare Worker가 직접 처리하는 API 로직 쉘. 네이버 로그인, 후기/댓글/좋아요/스탬프 쓰기 등을 Worker에서 직접 처리하며, 관리자 기능 등 일부는 FastAPI origin으로 위임합니다.
- **`docker-compose.cloudflare.yml`**: Cloudflare 환경에 맞춘 Docker Compose 설정.
- **`.env.cloudflare.example`**: Cloudflare 배포 시 필요한 환경 변수 예시 파일.

### 12. `infra/docker/frontend/` : 프론트엔드 컨테이너화 로직

- **`Dockerfile`**: 멀티 스테이지 빌드 방식. `node:20-alpine`에서 빌드 후 `nginx:1.27-alpine` 기반으로 정적 파일을 서빙합니다.
- **`40-write-app-config.sh`**: Nginx 시작 전 컨테이너 환경 변수를 읽어 `app-config.js`를 동적 생성함으로써 **배포 시점**에 API URL과 API 키를 주입합니다.
- **`default.conf.template`**: Nginx 가상 호스트 설정 템플릿. `/api/` 및 `/uploads/` 경로를 백엔드로 프록시하고, 정적 자원에 캐시를 적용하며, SPA 클라이언트 라우팅을 지원합니다.

### 13. `infra/nginx/` : 독립 웹 서버 설정 (비컨테이너 환경용)

- **`nginx.conf`**: 백엔드 API 서버(`127.0.0.1:8001`)를 Upstream으로 그룹화하고, 8000번 포트에서 리버스 프록시·캐시·업로드 용량(`10m`) 제한을 제어하는 설정.
- **`conf/mime.types`**: 파일 확장자에 따른 Content-Type 매핑.

### 14. `scripts/` : 개발 및 운영 자동화 도구

### **(1) 로컬 개발 환경 통합 관리**

- **`dev.ps1`**: `start`, `stop`, `status`, `logs`, `build` 액션을 지원하는 로컬 개발 환경 컨트롤 타워. MySQL, FastAPI(Uvicorn), Nginx 프로세스를 순차적으로 실행하거나 종료합니다.
- **`start-local-stack.ps1` / `stop-local-stack.ps1`**: `dev.ps1`을 래핑하여 한 줄의 명령어로 전체 개발 환경을 켜고 끕니다.
- **`install-local-mysql.ps1`**: `.runtime/mysql` 하위에 MySQL 8.4 바이너리를 다운로드·설치하는 스크립트. 시스템 전역 설치를 건드리지 않습니다.
- **`mysql-local.ps1`**: `Setup`, `Start`, `Stop`, `Status` 액션으로 portable MySQL을 제어합니다. 데이터 디렉터리와 로그를 `.runtime/mysql/local` 하위에 유지합니다.
- **`install-local-nginx.ps1`**: `infra/nginx/dist`에 Nginx 1.29.6 Windows 바이너리를 설치합니다.

### **(2) 프론트엔드 빌드 및 배포 도구**

- **`build-frontend.mjs`**: Esbuild를 사용하여 프론트엔드 자산을 번들링합니다. `.env`에서 API URL과 네이버 지도 API 키를 읽어 `app-config.js`에 주입하고, PWA 매니페스트·아이콘을 생성합니다.
- **`build-frontend.ps1`**: Windows PowerShell 환경에서 `esbuild.exe`를 직접 호출해 정적 번들을 생성하는 스크립트. Node.js 기반 spawn에 의존하지 않아 PowerShell 실행 환경에서 더 안정적입니다.
- **`create-cloudflare-pages-project.ps1` / `deploy-cloudflare-pages.ps1`**: Cloudflare Pages 프로젝트 생성 및 Wrangler를 이용한 정적 파일 배포를 자동화합니다.

### **(3) 데이터 생성 및 시딩 스크립트**

- **`generate-sample-place-data.mjs`**: HTML 소스로부터 장소 정보를 파싱하여 JSON 및 SQL 마이그레이션 파일(`20260323_seed_sample_places.sql`)을 생성합니다. 슬러그 생성, 구(District) 추론, 태그 추출 등의 전처리 로직이 포함되어 있습니다.
- **`generate_seed_places.ps1`**: 카테고리별 기본 설명·태그·방문 시간 값을 자동 생성해 장소 SQL 시드 파일을 만드는 PowerShell 스크립트.
- **`upload-sample-place-images.mjs`**: 로컬의 샘플 이미지를 Supabase Storage에 업로드하고, `map` 테이블의 이미지 URL을 업데이트(PATCH)합니다.

---

### 15. `src/` 디렉토리 전체 구조

```
src/
├── api/            # 백엔드 API 통신 클라이언트 정의
├── components/     # UI 컴포넌트 (탭, 시트, 패널 등)
├── data/           # 정적 데이터 스키마 및 상수
├── hooks/          # 비즈니스 로직 및 상태 제어를 위한 커스텀 훅
├── lib/            # 유틸리티 함수 (지리 정보, 이미지 처리, 카테고리 등)
├── store/          # Zustand 기반 전역 상태 저장소
├── styles/         # CSS 스타일 보정 파일
├── App.tsx         # 메인 앱 컴포넌트 (라우팅 및 레이아웃)
├── main.tsx        # 프론트엔드 진입점 (엔트리 파일)
├── config.ts       # 프론트엔드 전역 설정
├── types.ts        # 공통 TypeScript 타입 정의
└── publicEventTypes.ts # 공공 행사 관련 타입 정의
```

### 16. `src/` 루트 파일: 앱의 시작점과 설정

- **`main.tsx`**: 애플리케이션의 엔트리 포인트. React `StrictMode`를 활성화하고 `App.tsx`를 DOM에 렌더링하며 글로벌 스타일을 로드합니다.
- **`App.tsx`**: 전체 앱의 메인 레이아웃 및 라우팅 컨트롤러. `BottomNav`와 연동되어 지도·행사·피드·코스·마이페이지 탭 전환을 관리하고, `useAppBootstrapActions`와 `useAppTabDataLoaders`로 앱 구동 및 탭별 데이터 로드 흐름을 제어합니다.
- **`config.ts`**: `window.__JAMISSUE_CONFIG__`를 읽어 백엔드 API 베이스 URL과 네이버 지도 클라이언트 ID를 제공하는 런타임 설정 유틸리티.
- **`types.ts`**: `Place`, `Review`, `User`, `StampState`, `UserRoute`, `TravelSession` 등 백엔드 API 규격과 일치하는 핵심 TypeScript 타입 정의.
- **`publicEventTypes.ts`**: 공공 API로부터 가져오는 행사 정보 및 배너 데이터 전용 타입 정의.

### 17. `src/api/` : 백엔드 통신 레이어

**`src/api/client.ts`**는 프로젝트의 메인 API 클라이언트입니다.

- **기본 설정**: `config.ts`의 `apiBaseUrl` 기반으로 통신 인스턴스를 생성.
- **인증 처리**: 로그인 상태라면 모든 요청 헤더에 JWT를 자동으로 포함.
- **공통 인터셉터**: 401 에러 발생 시 로그아웃 처리 및 에러 메시지 정규화.
- **주요 API 엔드포인트 매핑**:
    - `getBootstrap()`: 앱 초기 구동 시 필요한 모든 데이터를 한 번에 가져옵니다.
    - `getPlaces()`, `getReviews()`, `getEvents()`: 탭별 목록 데이터 조회.
    - `toggleStamp()`, `writeReview()`, `createUserRoute()`: 사용자 액션을 서버에 반영.
    - `importPublicData()`: 공공데이터를 수동으로 DB에 임포트(관리자).
    - `updatePlaceVisibility()`: 장소의 활성화/수동 오버라이드 상태를 변경(관리자).

### 18. `src/components/` : UI 컴포넌트 총집합

### **(1) 기능별 메인 탭 (Tab Stages)**

- **`MapTabStage.tsx` / `NaverMap.tsx`**: 네이버 지도 SDK를 활용한 대전 장소 시각화. 카테고리 필터칩, 경로 미리보기 카드, `PlaceDetailSheet`·`FestivalDetailSheet`를 통합 관리합니다.
- **`FeedTab.tsx`**: 사용자 방문 후기 타임라인. 자동 무한 스크롤(`useAutoLoadMore`)과 스크롤 위치 복원 기능이 적용되어 있습니다.
- **`CourseTab.tsx`**: 에디터 큐레이션 코스와 사용자 공유 경로 목록을 보여줍니다.
- **`EventTab.tsx`**: 대전 공공 행사·축제 정보를 카드 형태로 리스트화합니다.
- **`MyPagePanel.tsx`**: 로그인/로그아웃, 닉네임 수정, 스탬프 로그 확인, 직접 만든 경로 관리 및 관리자 패널 진입을 담당합니다.

### **(2) 특화 비즈니스 기능 컴포넌트**

- **`MyRouteBuilder.tsx`**: 획득한 스탬프들을 조합하여 새로운 여행 경로를 설계하고 발행하는 도구.
- **`ReviewComposer.tsx`**: 사진 업로드 및 무드 선택을 포함한 후기 작성 인터페이스.
- **`CommunityRouteSection.tsx`**: 사용자들이 공유한 경로 목록을 좋아요순(`popular`)/최신순(`latest`) 정렬로 탐색하는 섹션 컴포넌트.
- **`AdminPanel.tsx`**: 관리자 전용 화면. 시스템 지표(사용자 수, 피드 수 등) 확인, 공공 데이터 동기화, 장소 노출 상태 제어 기능을 제공합니다.

### **(3) 상세 정보 시트**

- **`PlaceDetailSheet.tsx`**: 장소의 사진, 태그, 설명, 방문 횟수, 오늘의 스탬프 상태를 보여줍니다. 로그인 여부에 따라 '스탬프 찍기'/'후기 작성' 버튼의 활성화 상태를 제어합니다.
- **`FestivalDetailSheet.tsx`**: 공공데이터 API를 통해 가져온 축제의 기간, 위치, 상세 내용을 서빙합니다.

### **(4) 후기 및 댓글 시스템**

- **`ReviewList.tsx`**: 작성자 닉네임, 방문 시각, 본문, 사진, 좋아요 수·댓글 수를 표시하며, 본인이 좋아요를 누른 후기를 하트 색상으로 구분합니다.
- **`CommentThread.tsx`**: 부모 댓글과 답글(대댓글)을 트리 형태로 렌더링. 삭제된 댓글은 구조를 유지하며 "삭제된 댓글입니다"로 안내합니다.
- **`FeedCommentSheet.tsx`**: 특정 후기에 대한 댓글을 별도의 오버레이 시트에서 집중하여 보거나 작성하도록 돕습니다.

### **(5) 전역 UI 및 보조 요소**

- **`BottomNav.tsx`**: 5개의 메인 탭을 전환하는 고정 네비게이션 바.
- **`FloatingBackButton.tsx`**: 드래그 가능한 플로팅 버튼. 상세 화면에서 이전 상태로 돌아갑니다.
- **`RoadmapBannerPreview.tsx`**: 서비스 공지나 실시간 행사 일정을 요약해서 보여주는 프리뷰 배너.
- **`ProviderButtons.tsx`**: 활성화된 소셜 로그인 버튼(네이버 등)과 준비 중인 버튼(카카오 등)을 렌더링합니다. `isEnabled` 상태에 따라 비활성화 스타일을 적용합니다.

### 19. `src/data/` : 정적 데이터 스키마 및 상수

- **`roadmapBannerSchema.ts`**: 로드맵 배너에 들어갈 텍스트·링크 등의 데이터 구조를 정의하여 일관성을 유지합니다.

### 20. `src/hooks/` : 비즈니스 로직 제어 (Custom Hooks)

- **`useAppDataState.ts`**: 앱 전체의 로컬 상태(`bootstrapStatus`, `places`, `reviews`, `sessionUser` 등)를 초기화하고 세터를 모아서 제공합니다.
- **`useAppDerivedState.ts`**: 전역 상태에서 컴포넌트가 필요로 하는 파생 상태(필터링된 장소, 선택된 장소의 스탬프 여부, 오늘의 방문 횟수 등)를 `useMemo`로 계산하여 반환합니다.
- **`useAppRouteState.ts`**: URL 쿼리 파라미터(`?tab=`, `?place=` 등)를 읽고 앱의 탭·드로워 상태를 URL과 동기화합니다.
- **`useAppBootstrapActions.ts`**: 앱 초기 구동 시 Bootstrap API를 호출하여 인증 상태·장소·스탬프 데이터를 세팅하는 액션 훅.
- **`useAppTabDataLoaders.ts`**: 탭 전환 시 해당 탭에 필요한 데이터를 지연 로드(lazy load)하는 훅.
- **`useAppMutationActions.ts`**: 후기 작성·좋아요·스탬프·경로 발행 등 서버 데이터를 변경하는 모든 뮤테이션 액션을 통합 관리합니다.
- **`useAppNavigationActions.ts`**: 장소·코스 선택, 댓글 시트 열기, 드로워 상태 전환 등 내비게이션 관련 상태 변경을 처리합니다.
- **`useAppPaginationActions.ts`**: 피드와 마이 댓글의 커서 기반 페이지네이션 로직을 담당합니다.
- **`useAutoLoadMore.ts`**: `IntersectionObserver`를 활용해 sentinel 요소가 뷰포트에 진입하면 자동으로 다음 페이지를 로드하는 무한 스크롤 훅.
- **`useScrollRestoration.ts`**: 탭 전환 후 돌아왔을 때 이전 스크롤 위치를 복원하는 훅.

### 21. `src/lib/` : 유틸리티 및 도메인 지식

- **`categories.ts`**: 카테고리별 테마 색상(잼 컬러) 및 아이콘 정보를 관리합니다.
- **`filterPlaces.ts`**: 카테고리 필터 칩 선택에 따라 장소 목록을 필터링하는 순수 함수.
- **`geolocation.ts`**: GPS 좌표를 비동기로 획득하는 유틸리티 함수.
- **`imageUpload.ts`**: 이미지 파일 크기·형식 유효성 검사 및 백엔드 업로드 API 호출 로직.
- **`visits.ts`**: 스탬프 로그에서 오늘의 방문 횟수, 최근 스탬프 일시, 두 지점 간 거리(미터) 계산 등 방문 기록 관련 도메인 함수 모음.

### 22. `src/store/` : 전역 상태 관리 (Zustand)

- **`app-runtime-store.ts`**: 서버에서 받은 장소, 리뷰, 코스 데이터, 사용자 세션 정보, API 요청 진행 상태(submitting, loading 등)를 보관합니다.
- **`app-ui-store.ts`**: 현재 활성 탭, 바텀 시트 드로워 상태(`closed/partial/full`), 선택된 장소·축제 ID, 마이페이지 탭, 피드 플레이스 필터 등 UI의 일시적인 상태를 관리합니다.

### 23. `src/styles/` : 스타일 보정

- **`refinements.css`**: Tailwind CSS 표준 클래스만으로 해결하기 어려운 미세한 수치 조정, 스크롤바 숨기기, 애니메이션 효과를 정의합니다.

---

### 24. `docs/` : 프로젝트 설계 및 운영 문서 저장소

### **(1) 제품 및 준수 사항**

- **`prd-compliance.md`**: PRD 대비 현재 구현 상태 추적. 네비게이션·스탬프·인증 등 '구현됨' 항목과 카카오 로그인 등 '미구현' 항목을 명확히 구분합니다.

### **(2) 화면 및 사용자 경험 설계**

- **`screen-spec.md`**: UI 구조와 상호작용 규칙. 하단 탭의 역할, 바텀 드로워 상태(`closed/partial/full`), 스탬프·후기 작성 버튼의 활성화 조건 등 QA 체크리스트를 포함합니다.

### **(3) 도메인 로직 및 데이터 설계**

- **`community-routes.md`**: 24시간 이내의 스탬프 기록을 `travel_session`으로 묶어 코스로 발행하는 핵심 로직과 데이터 모델.
- **`account-identity-schema.md`**: 서비스 내부 계정(`user`)과 외부 소셜 로그인(`user_identity`)을 분리하는 설계. 이메일 자동 병합 금지 원칙과 회원 탈퇴·댓글 삭제 시 데이터 처리 규칙.
- **`search-recommendation-scope.md`**: 검색 v1의 범위 기준. 장소·코스 자유 텍스트 검색(최대 장소 10개, 코스 5개)을 지원하며, 댓글 전문 검색과 AI 기반 의미 검색은 제외됩니다.

### **(4) 운영 및 배포 가이드**

- **`growgardens-deploy-runbook.md`**: Cloudflare Pages/Worker 및 Supabase 기반 실 운영 환경 배포 매뉴얼. 환경 변수, 시크릿 설정, SQL 적용 순서 등 인프라 가동에 필요한 모든 단계.
- **`data-operations-runbook.md`**: 장소 데이터 수정, 이미지 교체, 공공데이터 동기화 등 운영 상황에서의 데이터 관리 절차. 수동 보정 데이터를 보호하기 위한 `is_manual_override` 규칙 포함.

### **(5) 기술 아키텍처**

- **`code-flow-diagrams.md`**: Mermaid 다이어그램으로 시스템의 주요 흐름을 시각화. UI부터 DB/스토리지까지의 전체 구조, Bootstrap·스탬프·리뷰·네이버 로그인·마이페이지 집계·코스 발행 등 기능별 호출 순서를 분석합니다.
- **`worker-first-poc.md`**: Cloudflare Worker에서 네이버 로그인과 후기/댓글/좋아요/스탬프/추천 경로 쓰기까지 직접 처리하는 POC 설계 문서. 관리자 기능 등 아직 옮기지 않은 경로는 FastAPI origin으로 위임하는 선택적 전략을 기술합니다.
