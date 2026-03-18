# JamIssue PRD 대비 구현 체크

기준일: 2026-03-18  
기준 브랜치: `codex/production-deploy`

이 문서는 현재 저장소 기준으로 PRD 요구사항이 어디까지 반영됐는지 확인하는 문서입니다.

## 완료된 항목

- 하단 탭 `지도 / 피드 / 코스 / 마이`
- 지도 탭 전용 장소 드로워 구조
- 스탬프 적립 반경 검증
- `user_stamp` 로그 기반 반복 방문
- 같은 장소 재방문 시 `n번째 방문` 계산
- 스탬프 간격 24시간 기준 `travel_session` 분리
- 후기 작성 시 `stamp_id` 필수 검증
- 사용자 생성 경로를 `travel_session_id` 기준으로 발행
- 경로 정렬 `좋아요순(popular)` / `최신순(latest)`
- 마이페이지 통계 분리
  - 고유 방문 장소 수
  - 누적 스탬프 수
- `user` 와 `user_identity` 분리
- 같은 이메일 자동 병합 금지
- 닉네임 중복 허용
- 회원 탈퇴 시 `user_id` 기준 정리 규칙 반영
- 댓글 soft delete, 부모 삭제 후 대댓글 유지
- 피드 삭제 시 댓글/좋아요 정리
- 축제 정보 레이어 추가
  - 대전 한정
  - 진행 중 + 30일 이내 예정 행사

## 부분 완료 항목

### 1. 지도 탭 UX
- 장소 상세는 바텀 드로워로 동작
- 다만 프로토타입 재현도는 아직 더 손볼 여지가 있음
  - 상단 카드 크기
  - 지도 카드 높이
  - 드로워 비율
  - 버튼 위치 정리

### 2. 인증
- 네이버 로그인 동작
- 카카오는 구조만 있고 실제 OAuth는 아직 미구현
- 닉네임 수정 단계는 계정 흐름에 반영되어 있으나 UX는 더 정리 가능

### 3. 운영 기능
- 관리자 성격의 최소 구조는 있으나, 별도 운영 페이지로 분리된 상태는 아님

### 4. 공공데이터
- 축제 API 연동 구조와 동기화는 반영
- 더 많은 공공데이터 소스 확장은 미완료

## 미완료 항목

- 카카오 OAuth 실제 연결
- 관리자 전용 백오피스 분리
- 모바일 QA 문서와 검수 결과 체계화
- 관측성/모니터링 문서 정리

## 현재 데이터 규칙

### 스탬프
- `user_stamp` 는 방문 로그 테이블
- `UNIQUE(user_id, position_id, stamp_date)`
- 같은 장소라도 날짜가 다르면 재방문 허용
- `visit_ordinal` 로 방문 회차 표시

### 여행 세션
- 직전 스탬프와 다음 스탬프 차이가 24시간 이내면 같은 `travel_session`
- 24시간 초과 시 새 세션 생성

### 후기 작성
- `stamp_id` 없는 후기 작성 불가
- `feed.position_id` 와 `user_stamp.position_id` 일치 검증

### 사용자 생성 코스
- `travel_session_id` 기준으로만 발행
- 같은 세션으로 중복 발행 불가
- 세션 안의 스탬프 순서대로 장소를 묶음

## 검증 상태

- `backend/.venv/Scripts/python.exe -m pytest tests` 통과 (`24 passed`)
- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 관련 문서

- [community-routes.md](/D:/Code305/JamIssue/docs/community-routes.md)
- [account-identity-schema.md](/D:/Code305/JamIssue/docs/account-identity-schema.md)
- [screen-spec.md](/D:/Code305/JamIssue/docs/screen-spec.md)
- [README.md](/D:/Code305/JamIssue/README.md)
