# Notification SSE Architecture

JamIssue 알림은 이제 마이페이지 전체 재조회에만 의존하지 않고, 알림 도메인을 분리한 뒤 SSE로 즉시 반영하는 구조를 사용합니다.

## 목표

- 댓글 또는 대댓글 생성 시 상대방 화면의 알림 배지가 새로고침 없이 갱신
- 알림 목록도 같은 이벤트로 즉시 갱신
- 읽음/전체 읽음/삭제는 서버 상태와 클라이언트 상태를 함께 동기화

## 현재 구조

### 백엔드

- `user_notification` 테이블에 알림 row 저장
- 댓글 생성 성공 후 알림 row를 만든 다음 in-memory broker에 publish
- `GET /api/my/notifications/stream` 가 SSE로 이벤트 전달
- 읽음/전체 읽음/삭제도 broker를 통해 후속 이벤트 전달

### 프론트엔드

- `src/store/notification-store.ts`
- 로그인 상태에서 앱 전역이 SSE 연결 유지
- 종 아이콘과 마이페이지 알림 패널은 store를 source of truth로 사용
- `myPage` 데이터는 유지하되 렌더 시점에 알림 상태만 store 값으로 합성

## 이벤트 흐름

1. 사용자가 댓글 또는 대댓글 작성
2. `create_comment_service` 가 repository 호출
3. repository가 `user_notification` row 저장
4. service가 대상 사용자별 unread count 계산
5. broker가 대상 사용자 SSE 구독자에게 이벤트 publish
6. 프론트 `notification-store` 가 이벤트 반영
7. 배지와 목록 UI가 즉시 갱신

## 알림 생성 규칙

- 일반 댓글: 리뷰 작성자에게 `review-comment`
- 대댓글: 부모 댓글 작성자에게 `comment-reply`
- 자기 자신에게는 알림 생성 안 함
- 리뷰 작성자와 부모 댓글 작성자가 같으면 중복 알림 생성 안 함

## API

### `GET /api/my/notifications`

- 현재 사용자 알림 목록 조회
- 최근 알림을 최신순으로 반환

### `GET /api/my/notifications/stream`

- SSE 스트림
- 인증 쿠키 필요
- 최초 연결 시 `connected` 이벤트 전달
- 유휴 상태에서는 heartbeat 전달

### `PATCH /api/notifications/{notificationId}/read`

- 단건 읽음 처리

### `PATCH /api/notifications/read-all`

- 전체 읽음 처리

### `DELETE /api/notifications/{notificationId}`

- 단건 삭제

## SSE 이벤트 규격

### `connected`

```json
{ "connected": true }
```

### `notification.created`

```json
{
  "notification": {
    "id": "2",
    "type": "review-comment",
    "title": "commenter님이 내 피드에 댓글을 남겼어요.",
    "body": "SSE live comment",
    "createdAt": "03. 26. 13:04",
    "isRead": false,
    "reviewId": "1",
    "commentId": "2",
    "routeId": null,
    "actorName": "commenter"
  },
  "unreadCount": 2
}
```

### `notification.read`

```json
{
  "notificationId": "2",
  "unreadCount": 1
}
```

### `notification.all-read`

```json
{
  "updated": 3,
  "unreadCount": 0
}
```

### `notification.deleted`

```json
{
  "notificationId": "2",
  "unreadCount": 0
}
```

### `heartbeat`

```json
{ "ok": true }
```

## 구현 파일

### 백엔드

- [backend/app/main.py](/C:/Users/C21/Desktop/JamIssue/backend/app/main.py)
- [backend/app/db_models.py](/C:/Users/C21/Desktop/JamIssue/backend/app/db_models.py)
- [backend/app/models.py](/C:/Users/C21/Desktop/JamIssue/backend/app/models.py)
- [backend/app/repository_normalized.py](/C:/Users/C21/Desktop/JamIssue/backend/app/repository_normalized.py)
- [backend/app/notification_broker.py](/C:/Users/C21/Desktop/JamIssue/backend/app/notification_broker.py)
- [backend/app/services/review_service.py](/C:/Users/C21/Desktop/JamIssue/backend/app/services/review_service.py)
- [backend/app/services/notification_service.py](/C:/Users/C21/Desktop/JamIssue/backend/app/services/notification_service.py)

### 프론트엔드

- [src/store/notification-store.ts](/C:/Users/C21/Desktop/JamIssue/src/store/notification-store.ts)
- [src/api/client.ts](/C:/Users/C21/Desktop/JamIssue/src/api/client.ts)
- [src/App.tsx](/C:/Users/C21/Desktop/JamIssue/src/App.tsx)
- [src/components/GlobalNotificationCenter.tsx](/C:/Users/C21/Desktop/JamIssue/src/components/GlobalNotificationCenter.tsx)

## 운영 주의사항

- 현재 broker는 in-memory
- 단일 프로세스/단일 인스턴스 기준에서는 정상 동작
- 멀티 인스턴스 또는 수평 확장 시 Redis pub/sub 같은 외부 브로커로 교체 필요
- SSE 인터페이스는 유지하고 broker 구현만 교체하는 방향을 권장

## 검증 메모

- 프론트 `npm run typecheck` 통과
- 프론트 `npm run build` 성공
- 백엔드 `python -m compileall backend/app` 통과
- 임시 SQLite 환경에서 `notification.created` SSE 이벤트 수신 확인
- 테스트 러너 `pytest` 는 현재 로컬 파일시스템 권한 제약으로 완전 통과까지는 확인하지 못함
