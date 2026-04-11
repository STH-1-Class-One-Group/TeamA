# App Bootstrap Refactor Postmortem

## 배경

`App.tsx`를 여러 hook과 stage 컴포넌트로 분리한 뒤, 배포 환경에서 다음 증상이 함께 나타났습니다.

- 초기 응답이 10초 이상 지연됨
- 지도 장소, 축제, 커뮤니티 데이터가 비어 보임
- 네이버 로그인과 알림 연결이 불안정해 보임
- 어떤 시점에는 일부 API만 붙고, 어떤 시점에는 전체 화면이 초기화되지 않은 것처럼 보임

겉으로는 API 장애처럼 보였지만, 실제 원인은 `App` 분리 이후 bootstrap effect와 callback lifecycle이 강하게 결합된 구조였습니다.

## 실제 원인

### 1. 초기 bootstrap에서 보조 데이터까지 한 번에 기다림

리팩토링 이후 초기 진입 시 `map-bootstrap`뿐 아니라 축제 목록까지 한 번에 기다리는 구조가 생겼습니다.
축제 데이터는 별도 소스를 경유해 오기 때문에 응답 편차가 컸고, 그 지연이 초기 화면 전체를 붙잡았습니다.

영향:

- 첫 진입이 느려짐
- 사용자는 "앱이 아예 안 붙는다"고 느끼게 됨

### 2. `App` 분리 이후 callback identity 변화가 bootstrap effect와 충돌

`refreshMyPageForUser`, `resetReviewCaches`, `goToTab`, `formatErrorMessage`, `reportBackgroundError` 같은 함수들이
분리된 hook에서 다시 만들어지면서 identity가 자주 바뀌었습니다.

이 상태에서 bootstrap effect가 이런 함수들을 dependency로 직접 물고 있으면:

- bootstrap effect가 다시 실행되고
- 중간 state 변경으로 callback identity가 또 바뀌고
- cleanup이 먼저 돌며 `active = false`가 되고
- 뒤늦게 도착한 응답이 state에 반영되지 않는 문제가 생깁니다

당시 `hasBootstrappedRef`로 중복 실행을 막으려 했지만,
이 방식은 "불안정한 실행"을 가리기만 할 뿐 lifecycle 충돌 자체를 해결하지 못했습니다.

결과:

- `map-bootstrap` 응답이 state에 안정적으로 반영되지 않음
- `providers`가 기본값으로 머무름
- `sessionUser`와 `myPage`가 비어 보여 로그인/알림이 끊긴 것처럼 보임
- 지도, 알림, 마이페이지가 같은 축에서 함께 흔들림

즉, 개별 컴포넌트 연결 문제가 아니라
`App` 분리 이후 bootstrap effect가 callback lifecycle 변화에 너무 민감했던 것이 핵심 원인이었습니다.

## 수정 내용

### 1. 초기 bootstrap과 보조 데이터 로드를 분리

초기 bootstrap에서는 `getMapBootstrap()`만 먼저 완료해 필수 상태를 채우고,
`getFestivals()`는 background 요청으로 분리했습니다.

효과:

- 지도, 세션, provider가 먼저 붙음
- 느린 축제 데이터가 첫 화면 전체를 막지 않음

### 2. bootstrap effect는 mount 기준으로 고정하고, 최신 callback은 ref로 추적

`src/hooks/useAppBootstrapLifecycle.ts`에서 다음 원칙으로 구조를 바꿨습니다.

- `hasBootstrappedRef` 제거
- `refreshMyPageForUser`
- `resetReviewCaches`
- `goToTab`
- `formatErrorMessage`
- `reportBackgroundError`

위 함수들을 effect dependency로 직접 묶지 않고 `useRef`로 최신 참조만 따라가게 바꿨습니다.

이렇게 하면:

- bootstrap effect는 mount 기준으로 안정적으로 한 번 실행되고
- callback identity가 바뀌어도 bootstrap 전체가 다시 취소되거나 흔들리지 않으며
- cleanup 때문에 첫 실행 결과가 사라지는 현상을 줄일 수 있습니다

핵심은 "중복 실행을 막는 가드"보다
"effect 입력을 안정화해서 lifecycle 충돌을 없애는 것"이었습니다.

## 결과

배포 확인 기준으로 현재는 다음 상태로 정리됐습니다.

- API가 정상적으로 응답함
- 지도, 로그인, 알림이 다시 안정적으로 붙음
- 초기 진입 체감 속도가 개선됨

## 교훈

`App.tsx`를 분리할 때는 파일 크기만 줄이면 끝나지 않습니다.
bootstrap, auth hydration, route sync, notification 연결처럼 "앱 시작 시점"에 묶인 effect는
callback identity 변화와 cleanup 타이밍까지 함께 설계해야 합니다.

앞으로 비슷한 리팩토링에서는 다음 원칙을 유지합니다.

- 초기 bootstrap은 필수 데이터만 기다린다
- 보조 데이터는 background로 분리한다
- mount 성격의 effect는 자주 바뀌는 callback을 직접 dependency로 묶지 않는다
- ref 가드보다 effect 입력 안정화를 먼저 해결한다
