# 백엔드 Gateway 연동

현재 개발용 백엔드 Base URL은 아래 주소로 설정되어 있습니다.

`http://1.201.116.40/api`

프론트 기본값은 `/api` 상대 경로이며, Vite proxy가 위 게이트웨이 주소로 전달합니다.
백엔드 주소가 바뀌면 `.env`의 `BACKEND_ORIGIN`만 수정한 뒤 **Vite 개발 서버를 반드시 재시작**하세요.

예시:
- `/api/auth/login` → `http://1.201.116.40/api/auth/login`
- `/api/users/me` → `http://1.201.116.40/api/users/me`
- `/api/routines/me/today` → `http://1.201.116.40/api/routines/me/today`

> 프론트는 개별 서비스 포트를 직접 호출하지 않고 Gateway 하나만 사용합니다.

---

# Next : Me - Pink Figma + Spring Boot API 연결본

기존 분홍 Figma 기반 React/Vite/TypeScript 프로젝트에 전달받은 인증/유저 API를 연결한 버전입니다.
Figma 원본 파일은 수정하지 않았습니다.

## 실행

```bash
npm install
npm run dev
```

로컬 백엔드 기본 주소는 Gateway `http://localhost:8080`입니다.

필요하면 `.env.example`을 `.env`로 복사한 뒤 URL 또는 Authorization 형식을 변경하세요.

## 연결한 인증 흐름

1. `POST /auth/email/send`
2. `POST /auth/email/verify`
3. `POST /auth/register`
4. `POST /auth/login`
5. 로그인 응답의 `userId`, `accessToken`, `username`, `name`, `email` 저장
6. 이후 보호 API에 `Authorization: Bearer {accessToken}` 적용

`POST /users/sync`는 login-service가 내부 처리하므로 프론트에서 호출하지 않습니다.
로그인 후 `/permissions` 이하 경로는 인증 토큰이 없거나 서버가 `401`을 반환하면 로그인 화면으로 이동합니다.

## 온보딩/프로필 API

- `GET /users/onboarding/template` (JWT 불필요)
- `PATCH /users/me`
- `GET /users/me`
- `POST /users/me/onboarding/answer`
- `POST /users/me/onboarding/skin-type-detail/final` (multipart/form-data)
- `POST /users/me/onboarding/personal-color-detail/final` (multipart/form-data)
- `POST /users/me/profile`
- `POST /users/me/onboarding/skin-type-detail/photo` (multipart/form-data)
- `POST /users/me/onboarding/personal-color-detail/photo` (multipart/form-data)

사진 최종 제출은 `detailAnswers`를 JSON 문자열로 FormData에 넣고, 사진이 있으면 `photo`를 추가합니다.

## 피드백 루틴 API

- `PUT /users/me/routine-preferences`
- `GET /users/me/routine-preferences`

최신 요청/응답은 아래 6개의 boolean 필드를 사용합니다.

- `routineCleansing`
- `routineSkinCare`
- `routinePersonalColor`
- `routineSleepWake`
- `routineDiet`
- `routineExercise`

## AI 채팅 API

- `POST /ai-chat/me/messages`
- `GET /ai-chat/me/conversations`
- `GET /ai-chat/me/conversations/{conversationId}/messages`
- `DELETE /ai-chat/me/conversations/{conversationId}`

첫 대화는 `conversationId: null`, 이후 대화는 응답으로 받은 `conversationId`를 다시 전송합니다.

## 오늘의 루틴 API

- `POST /routines/me/today/generate`
- `GET /routines/me/today`
- `GET /routines/me/today/progress`
- `PATCH /routines/me/today/items/{itemId}`
- `POST /routines/me/today/adjust`
- `GET /routines/me/settings`
- `PUT /routines/me/settings`
- `GET /routines/me/stats`

루틴 생성에는 선택적으로 `{ "additionalRequest": "..." }`를 전송할 수 있습니다.
완료/취소 `PATCH` 응답은 최신 완료율이 포함된 전체 일일 루틴이며, 버튼 활성화는 서버의 `editable`, `expired`를 기준으로 합니다.

## 퍼스널 컬러 추천 API

- `POST /personal-colors/me/analysis/start`
- `POST /personal-colors/me/analysis/messages`
- `GET /personal-colors/me/analysis/conversations?page=0&size=20`
- `GET /personal-colors/me/analysis/conversations/{conversationId}/messages?page=0&size=50`
- `POST /personal-colors/me/outfits/recommendations`
- `GET /personal-colors/me/outfits/recommendations/today`
- `GET /personal-colors/me/outfits/recommendations?page=0&size=20`
- `POST /personal-colors/me/makeup/recommendations`
- `GET /personal-colors/me/makeup/recommendations/today`
- `GET /personal-colors/me/makeup/recommendations?page=0&size=20`

모든 서비스는 같은 Gateway 주소를 사용합니다. 인증 4개 API와 온보딩 템플릿 조회를 제외한 사용자 API에는 Bearer 인증이 필요합니다.

## 화면 질문 순서

일반 프로필:

- 닉네임
- 성별을 선택해주세요
- 연령을 입력해 주세요
- 주로 일을 하는 요일은 어떻게 되시나요?
- 24시간 기준으로 출근 시간은 언제인가요?
- 24시간 기준으로 퇴근 시간은 언제인가요?
- 근무 스타일을 선택해 주세요
- 평균 수면 시간은 몇 시간인가요
- 평소 화장을 주로 하시나요
- 썬크림을 자주 바르시나요
- 주에 운동을 몇 번 하시나요
- 땀이 많이 나시는 편인가요

스킨 타입:

- 본인의 피부 타입은 무엇인가요?
- 주요 피부 고민을 선택해 주세요
- 세안 후 피부가 당기나요
- T존이 자주 번들거리나요
- 피부가 쉽게 붉어지거나 따가운가요
- 트러블이 자주 생기나요

퍼스널 컬러:

- 당신의 퍼스널 컬러를 입력해 주세요
- 손목 혈관 색은 어떤 편인가요
- 평소 더 잘 어울리는 악세사리 색은
- 어울리는 립 컬러는 어떤 계열인가요
- 전체적으로 잘 어울리는 톤은

## 프로필 요청 필드 매핑

최신 `POST /users/me/profile` Body에는 `gender`, `comeTime`, `leaveTime`, `personalColor`가 포함됩니다.
화면의 `time` 입력값은 `HH:mm` 형식(`09:00`, `19:00`)으로 전송합니다.

- 출가/출근 시간 → `comeTime`
- 귀가/퇴근 시간 → `leaveTime`

이전 명세에 있던 프론트 임시 필드 `exerciseOften`은 더 이상 전송하지 않습니다.
프로필 직접 저장 요청에는 `onboardingMode: "DIRECT"`를 포함합니다.


## 온보딩 질문 표시 순서

아래 순서는 화면에서 고정해서 사용합니다. 서버가 `nextQuestions`를 다른 순서로 반환해도 프론트에서 다시 정렬합니다.

1. 닉네임
2. 성별을 선택해주세요
3. 연령을 입력해 주세요
4. 주로 일을 하는 요일은 어떻게 되시나요?
5. 24시간 기준으로 출근 시간은 언제인가요?
6. 24시간 기준으로 퇴근 시간은 언제인가요?
7. 근무 스타일을 선택해 주세요
8. 평균 수면 시간은 몇 시간인가요
9. 평소 화장을 주로 하시나요
10. 썬크림을 자주 바르시나요
11. 주에 운동을 몇 번 하시나요
12. 땀이 많이 나시는 편인가요
13. 본인의 피부 타입은 무엇인가요?
14. 주요 피부 고민을 선택해 주세요
15. 세안 후 피부가 당기나요
16. T존이 자주 번들거리나요
17. 피부가 쉽게 붉어지거나 따가운가요
18. 트러블이 자주 생기나요
19. 당신의 퍼스널 컬러를 입력해 주세요
20. 손목 혈관 색은 어떤 편인가요
21. 평소 더 잘 어울리는 악세사리 색은
22. 어울리는 립 컬러는 어떤 계열인가요
23. 전체적으로 잘 어울리는 톤은

## 회원가입 인증번호 전송 수정

회원가입 화면의 `인증번호 전송` 버튼은 이제 하단 `가입하기` 버튼을 먼저 누르지 않아도 동작합니다.
최신 프론트 명세에 맞춰 이메일 인증을 먼저 완료한 뒤 회원가입합니다.

1. `POST /auth/email/send`
2. 인증번호 입력 후 `POST /auth/email/verify`
3. 인증 완료 후 `POST /auth/register`
4. 로그인 화면으로 이동

## 백엔드 온보딩 템플릿 동적 반영

온보딩의 서버 정의 질문은 JWT 없이 `GET /users/onboarding/template`로 조회합니다.
프론트는 `field`를 기준으로 화면 순서만 유지하고, `question`과 `options`는 백엔드 응답을 우선 사용합니다.
따라서 백엔드에서 예를 들어 `sleepHour.question` 또는 `workStyle.options`를 수정하면 재실행/재로그인 없이 해당 온보딩 화면 진입 시 최신 값으로 갱신됩니다.

최신 백엔드 템플릿의 `gender`, `comeTime`, `leaveTime` 문구와 선택지를 화면에 반영합니다.


## 2026-08-14 Figma 최신화
- 핑크 디자인만 기준으로 적용했습니다. Figma 원본은 수정하지 않았습니다.
- 기본/근무/생활 프로필을 3단계 진행 표시로 정리했습니다.
- 스킨 타입과 퍼스널 컬러 상세 질문을 최신 Figma의 드롭다운 행 형태로 변경했습니다.
- AI 맞춤 상담은 Figma `127:199 (수정된 느낌)` 기준으로 위치/말풍선/하단 버튼을 갱신했습니다.

## 2026-08-17 Figma 추가 프레임 반영
- Figma 원본은 읽기 전용으로 확인했으며 쓰기 작업을 하지 않았습니다.
- 메뉴의 기본/루틴/캐릭터/퍼스널 컬러 확장 상태를 반영했습니다.
- 루틴 설정, 만들기, 피부 관리 가이드, 완료하기, 수정하기, 완료 조회 화면을 추가했습니다.
- 루틴 완료 조회에는 백엔드 `scheduledTime`, `deadlineAt`을 실행·마감 시간으로 표시합니다.
- 퍼스널 컬러 메뉴의 옷 추천, 화장 추천, 추천 이력 버튼을 각 백엔드 API 화면에 연결했습니다.
