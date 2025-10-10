# 캠핑장 예약 알림 시스템

## 시스템 설명
캠핑장을 스크래핑해서 빈 자리가 있으면 알람을 받는 시스템

## 아키텍처
- **Backend**: Express, Playwright, Firebase Admin, node-cron, nodemailer
- **Frontend**: React, Firebase, Tailwind CSS, Ant Design
- **Firebase** (프로젝트명: camping-scraper-prod)
  - Firestore Database
  - Firebase Authentication: Google

## 주요 기능

### 1. 로그인 및 사용자 설정
- Firebase Authentication 로그인
- Push 및 알람 받을 이메일 등록

### 2. 캠핑장 Site 스크래핑
- MVP는 로그인이 필요없는 1개의 사이트를 대상으로 수행 (충북 단양 다리안계곡캠핑장)
- 향후에는 로그인이 필요한 다수의 사이트를 한번에 스크래핑하여 빈자리를 찾을 수도 있음

### 3. 사용자 설정
- 로그인한 사용자는 캠핑을 하고자 하는 캠핑장, 지역, 날짜를 설정할 수 있음
- 날짜는 특정일자 또는 from~to 를 지정할 수 있음
- 사용자는 1개 이상의 설정 정보를 등록할 수 있음
- 시스템은 다수의 사용자가 사용할 수 있음

### 4. 사용자 알림
- 사용자가 원하는 설정에 빈자리가 생기면 사용자의 메일과 Push로 알람을 보내줌

### 5. 실행 환경
- 스크래핑은 서버에서 수행함
- 스크래핑은 1분 주기로 수행하나, 앞뒤로 5초~20초 사이를 랜덤으로 추가하여 실행 반복 주기를 랜덤하게 수행
- 스크래핑은 오늘보다 미래에 사용자가 설정된 날이 있을 때만 수행
  - 사용자가 설정한 날이 없을 때는 스크래핑은 SKIP하여 수행하지 않음
- 스크래핑은 한국시간 01:00~08:00까지는 수행하지 않음

### 6. 화면 구성
다음과 같이 5개 화면을 제공:

1. **로그인**: Firebase Authentication 로그인
2. **가용 사이트**: 사용자가 설정한 조건에 해당하는 캠핑장 (장소, 날짜, 여유 수량, 알람여부)
3. **사용자 설정**: 예약하고자 하는 조건을 등록 (No, 지역, 캠핑장, 구역, 날짜(from~to))
4. **알람 목록**: 메일이나 Push로 알람을 보낸 이력 (로그인 사용자를 포함한 전체 사용자 기준)
5. **스크래핑 이력**: 실제 스크래핑을 수행한 이력 (로그인 사용자를 포함한 전체 사용자 기준)

### 7. MVP 사이트

#### 스크래핑 URL
```
https://mirihae.com/camping/calendar.do?checkType=&device=pc&tocken=20251009233437-4cb6fa5d-17f6-471d-8830-3b10d580e648&pageId=G24526799&groupCode=dytc&selectStartDate=&selectEndDate=&selectMonth=2025-11&selectItemId=&selectTicketId=&cnt=&infoType=&approvalId=&txId=
```

- **다음달 예시**: `selectMonth=2025-11`
- **이전달 예시**: `selectMonth=2025-10`

#### 스크래핑 주기
- 현재 한국기준 날짜를 기준으로 M, M+1, M+2 각각 3번을 스크래핑하여 저장

#### 스크래핑 파싱
- **날짜**: `<div class="element">` 위에 있는 `<a>` 태그
- **캠핑장내 구역**: `<dl>` 태그로 구분 (종류: 데크A, B, C, D, 원두막, 돔하우스)
- **예약가능한 수량**: `<dt>` 태그

---

## 프로젝트 구조

```
camping-scraper/
├── backend/               # Backend 서버 (Node.js + Express)
│   ├── src/
│   │   ├── config/       # Firebase, Email 설정
│   │   ├── services/     # 비즈니스 로직 (스크래핑, 알림, 스케줄러)
│   │   ├── routes/       # API 라우트
│   │   ├── middleware/   # 인증, 에러 핸들링
│   │   └── utils/        # 유틸리티 함수
│   └── package.json
│
├── frontend/             # Frontend 앱 (React + Vite)
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── services/     # API 클라이언트, Firebase
│   │   └── contexts/     # React Context (Auth)
│   └── package.json
│
└── README.md
```

## 시작하기

### 사전 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Firebase 프로젝트 (Firestore, Authentication)
- Gmail 계정 (이메일 알림용)

### Backend 설정

1. Backend 디렉토리로 이동:
```bash
cd backend
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
- `.env.example`을 `.env`로 복사
- 이메일 설정 업데이트:
  ```
  EMAIL_USER=your-email@gmail.com
  EMAIL_APP_PASSWORD=your-app-password
  ```

4. Firebase 서비스 계정 키 확인:
- 프로젝트 루트에 `camping-scraper-prod-firebase-설정.json` 파일이 있어야 함

5. 서버 실행:
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버는 `http://localhost:3000`에서 실행됩니다.

### Frontend 설정

1. Frontend 디렉토리로 이동:
```bash
cd frontend
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
- `.env.example`을 `.env`로 복사
- 필요시 API URL 수정:
  ```
  VITE_API_URL=http://localhost:3000/api
  ```

4. 개발 서버 실행:
```bash
npm run dev
```

5. 브라우저에서 열기:
```
http://localhost:5173
```

### 빌드

Frontend 프로덕션 빌드:
```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist` 디렉토리에 생성됩니다.

## API 엔드포인트

### 인증
- `POST /api/auth/verify` - 토큰 검증 및 사용자 생성
- `PUT /api/auth/profile` - 프로필 업데이트

### 사용자 설정
- `GET /api/settings` - 사용자 설정 목록
- `POST /api/settings` - 설정 생성
- `PUT /api/settings/:id` - 설정 수정
- `DELETE /api/settings/:id` - 설정 삭제

### 가용 사이트
- `GET /api/availability` - 가용 캠핑 사이트 조회

### 로그
- `GET /api/logs/notifications` - 알림 이력
- `GET /api/logs/scraping` - 스크래핑 이력

## 주요 기능

### 자동 스크래핑
- 10분마다 실행 (30-120초 랜덤 딜레이 추가)
- 한국시간 01:00-08:00 사이 휴면
- 활성화된 사용자 설정이 있을 때만 실행
- 사용자 설정 기반으로 필요한 년월만 스크래핑

### 알림 시스템
- 이메일 알림 (Gmail SMTP)
- 설정당 최초 1회만 알림 발송
- 알림 발송 후 설정 자동 비활성화
- 사용자 설정 조건 매칭

### 데이터베이스 (Firestore)
- **users**: 사용자 정보
- **userSettings**: 사용자 예약 설정
- **availability**: 스크래핑된 가용 데이터
- **notifications**: 알림 발송 이력
- **scrapingLogs**: 스크래핑 실행 이력

## 개발 가이드

### Backend 개발
- `src/services/scraper.service.js` - 스크래핑 로직 수정
- `src/services/scheduler.service.js` - 스케줄 설정 변경
- `src/services/notification.service.js` - 알림 로직 수정

### Frontend 개발
- `src/components/` - UI 컴포넌트
- `src/services/api.js` - API 클라이언트
- `src/contexts/AuthContext.jsx` - 인증 상태 관리

## 문제 해결

### Backend 실행 오류
- Firebase 서비스 계정 키 파일 경로 확인
- `.env` 파일의 환경 변수 확인
- Node.js 버전 확인 (18.x 이상)

### Frontend 실행 오류
- Backend 서버가 실행 중인지 확인
- Firebase 설정 확인 (`src/services/firebase.js`)
- 브라우저 콘솔에서 에러 메시지 확인

### 스크래핑이 작동하지 않는 경우
- 서버 로그 확인
- 스크래핑 이력 페이지에서 에러 메시지 확인
- 대상 웹사이트 HTML 구조 변경 여부 확인

## 외부 접속 (Cloudflare Tunnel)

로컬 서버를 외부에서 접속할 수 있도록 Cloudflare Tunnel을 지원합니다.

### 빠른 시작
```bash
# Backend 터널
./cloudflared.exe tunnel --url http://localhost:3000

# Frontend 터널
./cloudflared.exe tunnel --url http://localhost:5174
```

자세한 설정 방법은 **[외부 접속 가이드](docs/EXTERNAL_ACCESS_GUIDE.md)**를 참고하세요.

---

## 문서

상세한 문서는 `docs/` 폴더를 참고하세요:

- **[사용자 매뉴얼](docs/USER_MANUAL.md)** - 시스템 사용 방법
- **[운영자 매뉴얼](docs/OPERATOR_MANUAL.md)** - 시스템 운영 및 관리
- **[배포 가이드](docs/DEPLOYMENT_GUIDE.md)** - 서버 배포 방법
- **[테스트 가이드](docs/TESTING_GUIDE.md)** - 시스템 테스트 방법
- **[테스트 요약](docs/TESTING_SUMMARY.md)** - 테스트 이력
- **[외부 접속 가이드](docs/EXTERNAL_ACCESS_GUIDE.md)** - Cloudflare Tunnel 외부 접속

## 라이선스
MIT
