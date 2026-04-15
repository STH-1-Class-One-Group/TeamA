# JamIssue Nginx 로컬 프록시

이 프로젝트에서는 Nginx가 로컬 진입 프록시 역할을 맡습니다.

- `http://127.0.0.1:8000` 단일 진입점 제공
- 정적 프론트 파일 서빙과 FastAPI `/api` 프록시 처리

## 포트 구성

- Nginx: `127.0.0.1:8000`
- FastAPI: `127.0.0.1:8001`
- 프론트 정적 파일: `infra/nginx/site` 디렉터리

## 프록시 규칙

- `/api/*` -> FastAPI (`127.0.0.1:8001`)
- `/assets/*` -> 정적 번들 파일
- `/icons/*` -> 정적 아이콘
- 그 외 경로 -> `index.html` fallback

## 준비 순서

1. `scripts/install-local-nginx.ps1`로 로컬 nginx 바이너리 설치
2. `npm run build`로 프론트 정적 파일 생성
3. FastAPI 실행 후 nginx 시작

실제로는 [start-local-stack.ps1](../../scripts/start-local-stack.ps1)이 위 순서를 자동으로 처리합니다.
