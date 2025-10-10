# 시스템 점검 가이드

## 개요

이 문서는 캠핑장 예약 알림 시스템의 전반적인 동작을 점검하는 방법을 안내합니다.

## 빠른 점검 (Claude Code에게 요청)

다음과 같이 Claude Code에게 요청하면 자동으로 시스템을 점검합니다:

```
전반적으로 시스템이 정상적으로 동작하는지 점검해줘
```

또는:

```
시스템 점검해줘
```

## 자동화된 테스트 스크립트

### 사용법

```bash
# 전체 시스템 점검 (서버 재시작 포함)
./test-system.sh

# 빠른 점검 (서버 재시작 없이)
./test-system.sh --quick

# Backend만 점검
./test-system.sh --backend-only

# Frontend만 점검
./test-system.sh --frontend-only
```

### 테스트 항목

자동화 스크립트는 다음 항목을 점검합니다:

#### 1. 사전 요구사항 확인
- ✅ Node.js 설치 여부
- ✅ npm 설치 여부
- ✅ git 설치 여부
- ✅ curl 설치 여부
- ℹ️ Node.js 버전 확인
- ℹ️ npm 버전 확인

#### 2. Backend 설정 확인
- ✅ `.env` 파일 존재 여부
- ✅ 필수 환경 변수 설정 (EMAIL_USER, EMAIL_APP_PASSWORD)
- ✅ Firebase 서비스 계정 파일 존재 여부
- ✅ `package.json` 존재 여부
- ✅ `node_modules` 존재 여부

#### 3. Frontend 설정 확인
- ✅ `.env` 파일 존재 여부
- ✅ `package.json` 존재 여부
- ✅ `node_modules` 존재 여부

#### 4. Backend 서버 테스트
- 🚀 서버 시작 (새 프로세스로)
- ✅ Health check 엔드포인트 (`/health`)
- ✅ API 인증 미들웨어 동작 확인
- ✅ 서버 시작 로그 확인
- ✅ 스케줄러 시작 로그 확인
- ✅ 에러 로그 확인

#### 5. Frontend 서버 테스트
- 🚀 서버 시작 (새 프로세스로)
- ✅ HTML 서빙 확인
- ✅ React root 요소 확인

#### 6. 통합 테스트
- ✅ CORS 설정 확인
- ✅ Frontend → Backend 통신 가능 여부

#### 7. Firebase/Firestore 연결 테스트
- ✅ Firebase 초기화 확인

## 수동 점검 절차

### 1. Backend 점검

#### 1.1 Backend 시작
```bash
cd backend
npm start
```

**예상 출력:**
```
✅ Firebase initialized successfully
🚀 Server is running on port 3000
📅 Environment: development
[INFO] ... - ✅ Scheduler started successfully (runs every 10 minutes with 30-120s random delay)
⏰ Scraping scheduler started
```

#### 1.2 Health Check 테스트
```bash
curl http://localhost:3000/health
```

**예상 응답:**
```json
{"status":"OK","timestamp":"2025-10-10T12:00:00.000Z"}
```

#### 1.3 API 엔드포인트 테스트
```bash
# 인증 필요한 엔드포인트 (401 응답이 정상)
curl -X POST http://localhost:3000/api/auth/verify

# 예상 응답: 401 Unauthorized
```

### 2. Frontend 점검

#### 2.1 Frontend 시작
```bash
cd frontend
npm run dev
```

**예상 출력:**
```
VITE v5.4.20  ready in 1957 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**주의:** 포트 5173이 사용 중이면 5174 등 다른 포트를 사용합니다.

#### 2.2 브라우저 접속
```
http://localhost:5173
```

**예상 화면:**
- 로그인 페이지 표시
- "Google로 로그인" 버튼
- 이메일/비밀번호 입력 폼

#### 2.3 개발자 도구 확인
브라우저 F12 → Console 탭:
- ❌ 에러 메시지가 없어야 함
- ✅ React 앱이 정상 로드되어야 함

### 3. 전체 플로우 테스트

#### 3.1 회원가입 및 로그인
1. "회원가입" 클릭
2. 이메일/비밀번호 입력
3. 가입 완료 확인
4. 로그인 테스트

#### 3.2 알림 설정 추가
1. 대시보드 → "알림 설정"
2. "새 알림 설정 추가" 클릭
3. 정보 입력:
   - 캠핑장: 다리안계곡캠핑장
   - 지역: 경기도 (또는 충북 단양)
   - 구역: 데크A 선택
   - 날짜: 내일 ~ 모레
   - 활성화: ✅
4. 저장
5. 목록에 표시 확인

#### 3.3 스크래핑 동작 확인
Backend 로그 확인:
```bash
# 10분 대기 (또는 다음 스케줄러 실행까지)
# 로그에서 다음 메시지 확인:
⏰ Scheduler triggered. Waiting ...
🚀 Starting scheduled scraping...
✅ Scraping completed: ... items scraped
```

Firebase Console에서 확인:
1. Firestore → `scrapingLogs` 컬렉션
2. 최신 로그 확인
3. `status: "success"` 확인

#### 3.4 예약 가능 현황 확인
1. 대시보드 → "예약 가능한 캠핑장"
2. 데이터 표시 확인
3. 필터링 동작 확인

## 점검 체크리스트

### 배포 전 필수 체크리스트

- [ ] Backend 서버가 정상 시작되는가?
- [ ] Health check 엔드포인트가 응답하는가?
- [ ] Frontend가 정상 빌드되는가?
- [ ] Frontend에서 Backend API 호출이 가능한가?
- [ ] Firebase 초기화가 성공하는가?
- [ ] 스케줄러가 시작되는가?
- [ ] 회원가입/로그인이 동작하는가?
- [ ] 알림 설정 CRUD가 동작하는가?
- [ ] 예약 현황 조회가 동작하는가?

### 정기 점검 체크리스트 (일일/주간)

#### 일일 체크리스트
- [ ] Backend 프로세스가 실행 중인가?
- [ ] 최근 스크래핑 로그가 정상인가?
- [ ] 에러 로그가 없는가?
- [ ] 디스크 사용량이 정상인가?

#### 주간 체크리스트
- [ ] Firestore 데이터 크기 확인
- [ ] 백업 상태 확인
- [ ] 시스템 보안 업데이트 확인
- [ ] 사용자 피드백 검토

## 일반적인 문제 및 해결

### Backend가 시작되지 않음

**증상:**
```
Error: Cannot find module ...
또는
Firebase initialization failed
```

**해결:**
1. `npm install` 재실행
2. `.env` 파일 확인
3. Firebase 서비스 계정 파일 확인
4. Node.js 버전 확인 (18+ 필요)

### Frontend 빌드 실패

**증상:**
```
vite build failed
또는
Module not found
```

**해결:**
1. `npm install` 재실행
2. `.env` 파일 확인
3. 캐시 삭제: `rm -rf node_modules .vite`
4. 재설치: `npm install && npm run build`

### API 호출 실패 (CORS 오류)

**증상:**
```
Access to fetch at 'http://localhost:3000/api/...'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**해결:**
1. Backend에서 CORS 설정 확인
2. `backend/src/app.js`에서 `app.use(cors())` 확인
3. Backend 재시작

### 스크래핑이 실행되지 않음

**증상:**
- `scrapingLogs`에 새 로그가 없음

**해결:**
1. 현재 시간이 Sleep 시간(01:00-08:00 KST)인지 확인
2. 활성화된 사용자 설정이 있는지 확인
3. Backend 로그 확인
4. Playwright 재설치: `npx playwright install chromium`

## 로그 파일 위치

### Backend 로그
- **콘솔 출력**: 터미널에서 직접 확인
- **파일 로그** (테스트 스크립트 사용시): `backend-test.log`

### Frontend 로그
- **콘솔 출력**: 터미널에서 직접 확인
- **브라우저 콘솔**: F12 → Console 탭
- **파일 로그** (테스트 스크립트 사용시): `frontend-test.log`

### Firestore 로그
- Firebase Console → Firestore → `scrapingLogs` 컬렉션
- Firebase Console → Firestore → `notifications` 컬렉션

## 성능 지표

### 정상 동작 기준

| 항목 | 정상 범위 | 비고 |
|------|----------|------|
| Backend 시작 시간 | < 5초 | Firebase 초기화 포함 |
| Frontend 빌드 시간 | < 10초 | Vite 빌드 |
| Health check 응답 시간 | < 100ms | |
| API 응답 시간 | < 500ms | Firestore 쿼리 포함 |
| 스크래핑 실행 시간 | < 30초 | 3개월 데이터 |
| 메모리 사용량 (Backend) | < 500MB | 정상 범위 |

## 문의 및 지원

문제가 해결되지 않는 경우:
1. `OPERATOR_MANUAL.md`의 트러블슈팅 섹션 참조
2. GitHub Issues에 문의
3. 시스템 관리자에게 연락

---

**마지막 업데이트:** 2025-10-10
