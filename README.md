# 캠핑장 예약 알림 시스템 (Camping Reservation Notifier)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/kwhong/camping-reservation-notifier)](https://github.com/kwhong/camping-reservation-notifier/issues)

캠핑장 예약 가능 여부를 자동으로 모니터링하고, 원하는 날짜와 구역에 빈 자리가 생기면 즉시 이메일로 알림을 보내주는 시스템입니다.

> **🚀 빠른 시작**: [Getting Started 가이드](GETTING_STARTED.md)를 따라 5분 안에 시작하세요!

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

## 빠른 시작

> 자세한 설정 가이드는 **[GETTING_STARTED.md](GETTING_STARTED.md)**를 참고하세요.

### 사전 요구사항
- **Node.js** 18.x 이상
- **npm** 8.x 이상
- **Firebase 프로젝트** (Firestore, Authentication)
- **Gmail 계정** (이메일 알림용, App Password 필요)

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

## 📚 문서

### 시작하기
- **[Getting Started](GETTING_STARTED.md)** ⭐ - **처음 사용자 필독!** 5분 빠른 시작 가이드

### 사용자 문서
- **[사용자 매뉴얼](docs/USER_MANUAL.md)** - 시스템 사용 방법 (UI 가이드, 기능 설명)
- **[외부 접속 가이드](docs/EXTERNAL_ACCESS_GUIDE.md)** - Cloudflare Tunnel로 외부 접속 설정

### 운영자 문서
- **[운영자 매뉴얼](docs/OPERATOR_MANUAL.md)** - 시스템 운영 및 관리 (모니터링, 백업)
- **[배포 가이드](docs/DEPLOYMENT_GUIDE.md)** - 프로덕션 서버 배포 방법
- **[테스트 가이드](docs/TESTING_GUIDE.md)** - 시스템 테스트 절차
- **[테스트 요약](docs/TESTING_SUMMARY.md)** - 테스트 실행 이력

### 개발자 문서
- **[시스템 아키텍처](docs/SYSTEM_ARCHITECTURE.md)** ⭐ - **머메이드 다이어그램으로 보는 전체 시스템 구조**
- **[OpenAPI 명세](openapi.yaml)** - REST API 문서 (Swagger/Postman)
- **[JSDoc API 문서](backend/docs/API.md)** - 백엔드 함수/클래스 상세 문서
- **[API 클라이언트 생성](docs/API_CLIENT_GENERATION.md)** - TypeScript 클라이언트 생성 방법
- **[시스템 헬스 체크](docs/SYSTEM_HEALTH_CHECK.md)** - 전체 시스템 점검 리포트
- **[서버 재시작 체크](docs/SERVER_RESTART_CHECK.md)** - 재기동 후 점검 결과

### 개선 프로젝트 문서
- **[개선 계획](docs/IMPROVEMENT_PLAN.md)** - Phase 0-6 개선 계획
- **[보안 패치](docs/SECURITY_PATCH_v1.0.md)** - 보안 취약점 수정 내역
- **[배포 요약](docs/DEPLOYMENT_SUMMARY.md)** - Phase 0-4 배포 가이드
- **[최종 리포트](docs/FINAL_REPORT.md)** - 전체 개선 프로젝트 완료 리포트
- **[롤백 계획](docs/ROLLBACK_PLAN.md)** - 단계별 롤백 절차
- **[테스트 환경](docs/TESTING_ENVIRONMENT.md)** - 테스트 환경 구성 가이드

## 🎯 주요 개선 사항 (Phase 0-6)

최근 전체 시스템 개선 프로젝트를 완료했습니다:

### ✅ 완료된 개선 사항

| Phase | 개선 내용 | 주요 성과 |
|-------|----------|----------|
| **Phase 0** | 준비 단계 | 백업/복구 스크립트, 롤백 계획 |
| **Phase 1** | 보안 패치 | 3개 CVE 수정 (하드코딩 비밀번호, 권한 체크, CORS) |
| **Phase 2** | 데이터 무결성 | Firestore 쓰기 99% 감소, 저장 시간 80% 개선 |
| **Phase 3** | 에러 핸들링 | 15개 커스텀 에러 클래스, 리트라이 메커니즘 |
| **Phase 4** | 로깅 개선 | Winston 구조화 로깅, 파일 로테이션 |
| **Phase 5** | 코드 품질 | ESLint, Prettier, 중앙 설정 관리 |
| **Phase 6** | 모니터링 | 헬스 체크 4개 엔드포인트, Request ID 추적 |

자세한 내용은 **[최종 리포트](docs/FINAL_REPORT.md)**를 참고하세요.

---

## 🤝 기여하기

프로젝트에 기여하고 싶으신가요?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요 (예정).

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

## 💬 문의 및 지원

- **GitHub Issues**: [이슈 등록](https://github.com/kwhong/camping-reservation-notifier/issues)
- **GitHub Discussions**: [질문 및 토론](https://github.com/kwhong/camping-reservation-notifier/discussions)
- **이메일**: 프로젝트 관리자에게 문의

---

**Made with ❤️ by the Camping Reservation Notifier Team**
