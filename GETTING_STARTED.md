# Getting Started

캠핑장 예약 알림 시스템을 빠르게 시작하는 방법을 안내합니다.

---

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [빠른 시작 (5분)](#빠른-시작-5분)
3. [상세 설정 가이드](#상세-설정-가이드)
4. [첫 알림 설정하기](#첫-알림-설정하기)
5. [문제 해결](#문제-해결)
6. [다음 단계](#다음-단계)

---

## 시스템 요구사항

### 필수 사항
- **Node.js**: 18.x 이상 ([다운로드](https://nodejs.org/))
- **npm**: 8.x 이상 (Node.js와 함께 설치됨)
- **Firebase 프로젝트**: Google Firebase 계정 ([생성하기](https://console.firebase.google.com/))
- **Gmail 계정**: 이메일 알림 발송용 (App Password 필요)

### 선택 사항
- **Git**: 소스 코드 관리 ([다운로드](https://git-scm.com/))
- **VS Code**: 코드 에디터 ([다운로드](https://code.visualstudio.com/))

### 시스템 확인
```bash
# Node.js 버전 확인 (18.x 이상이어야 함)
node -v

# npm 버전 확인
npm -v

# Git 버전 확인 (선택)
git --version
```

---

## 빠른 시작 (5분)

### 1️⃣ 프로젝트 다운로드

```bash
# Git으로 클론
git clone https://github.com/kwhong/camping-reservation-notifier.git
cd camping-reservation-notifier

# 또는 ZIP 다운로드 후 압축 해제
```

### 2️⃣ Backend 설정 및 실행

```bash
# Backend 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 편집 (필수!)
notepad .env
```

**.env 파일 내용:**
```env
PORT=3000
NODE_ENV=development

# Gmail 설정
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```

**Gmail App Password 생성 방법:**
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성 (메일 선택)
3. 생성된 16자리 비밀번호를 `EMAIL_APP_PASSWORD`에 입력

**Firebase 서비스 계정 설정:**
```bash
# Firebase Console에서 서비스 계정 키 다운로드
# 프로젝트 루트에 저장: camping-scraper-prod-firebase-설정.json
```

**서버 시작:**
```bash
npm start
```

성공 메시지:
```
✅ Firebase initialized successfully
🚀 Server is running on port 3000
📅 Environment: development
⏰ Scraping scheduler started
```

### 3️⃣ Frontend 설정 및 실행

**새 터미널에서:**
```bash
# Frontend 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 편집
notepad .env
```

**.env 파일 내용:**
```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api
```

**Frontend 시작:**
```bash
npm run dev
```

성공 메시지:
```
VITE v5.4.20  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### 4️⃣ 브라우저에서 접속

http://localhost:5173/ 접속

---

## 상세 설정 가이드

### Firebase 프로젝트 설정

#### 1. Firebase Console에서 프로젝트 생성
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: camping-scraper-prod)
4. Google Analytics 설정 (선택 사항)

#### 2. Authentication 설정
1. Firebase Console → Authentication → 시작하기
2. 로그인 방법 → 이메일/비밀번호 활성화
3. 로그인 방법 → Google 활성화 (선택 사항)

#### 3. Firestore Database 생성
1. Firebase Console → Firestore Database → 데이터베이스 만들기
2. 프로덕션 모드로 시작
3. 위치 선택: `asia-northeast3` (서울) 권장

#### 4. 서비스 계정 키 다운로드
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. 파일 이름을 `camping-scraper-prod-firebase-설정.json`으로 변경
5. 프로젝트 **루트 디렉토리**에 저장

#### 5. Firebase 웹 앱 설정 (Frontend용)
1. Firebase Console → 프로젝트 설정 → 일반
2. "앱 추가" → 웹 앱 선택
3. 앱 닉네임 입력
4. Firebase SDK 구성 정보 복사
5. `frontend/src/services/firebase.js` 파일에 붙여넣기

```javascript
// frontend/src/services/firebase.js
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Gmail App Password 설정

1. **Google 계정 설정**
   - https://myaccount.google.com/ 접속
   - 보안 → 2단계 인증 활성화

2. **앱 비밀번호 생성**
   - 보안 → 앱 비밀번호
   - 앱 선택: 메일
   - 기기 선택: Windows 컴퓨터 (또는 기타)
   - 생성 클릭

3. **생성된 16자리 비밀번호 복사**
   - 예: `abcd efgh ijkl mnop`
   - 공백 제거: `abcdefghijklmnop`
   - `backend/.env`의 `EMAIL_APP_PASSWORD`에 입력

### Firestore 보안 규칙 설정

Firebase Console → Firestore Database → 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 컬렉션: 본인만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 사용자 설정: 본인만 읽기/쓰기
    match /userSettings/{settingId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }

    // 예약 가능 현황: 인증된 사용자 읽기 전용
    match /availability/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Backend만 쓰기 가능
    }

    // 알림 기록: 인증된 사용자 읽기 전용
    match /notifications/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Backend만 쓰기 가능
    }

    // 스크래핑 로그: 인증된 사용자 읽기 전용
    match /scrapingLogs/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Backend만 쓰기 가능
    }
  }
}
```

### Firestore 인덱스 설정

```bash
# Backend 디렉토리에서
cd backend

# Firebase CLI 설치 (전역)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 연동
firebase use --add
# 프로젝트 선택 후 alias 입력: production

# 인덱스 배포
firebase deploy --only firestore:indexes
```

---

## 첫 알림 설정하기

### 1. 회원가입 및 로그인

1. http://localhost:5173/ 접속
2. "회원가입" 클릭
3. 이메일과 비밀번호 입력
4. 또는 "Google로 로그인" 클릭

### 2. 프로필 설정

1. 우측 상단 프로필 아이콘 클릭
2. "프로필 편집" 선택
3. **알림 이메일 주소** 입력 (Gmail 권장)
4. 저장

### 3. 알림 설정 생성

1. 좌측 메뉴 → "알림 설정" 클릭
2. "새 설정 추가" 버튼 클릭
3. 설정 입력:
   - **캠핑장**: 다리안계곡캠핑장 (기본값)
   - **지역**: 충북 단양 (기본값)
   - **구역**: 원하는 구역 선택 (빈 칸이면 전체 구역)
   - **날짜 범위**: 예약을 원하는 날짜 범위
4. "저장" 클릭

### 4. 알림 동작 확인

**자동 스크래핑:**
- 스케줄러가 10분마다 자동 실행됨
- 설정한 조건에 맞는 예약 가능 시 이메일 발송
- 알림 전송 후 해당 설정 자동 비활성화 (중복 알림 방지)

**수동 확인:**
- 좌측 메뉴 → "예약 가능 현황" 클릭
- 현재 예약 가능한 자리 확인

**알림 기록:**
- 좌측 메뉴 → "알림 기록" 클릭
- 과거 발송된 이메일 확인

**스크래핑 기록:**
- 좌측 메뉴 → "시스템 로그" 클릭
- 스크래핑 실행 이력 확인

---

## 문제 해결

### Backend 서버가 시작되지 않음

#### 오류: "Cannot find module"
```bash
# 의존성 재설치
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 오류: "Firebase initialization failed"
```bash
# 서비스 계정 파일 확인
ls camping-scraper-prod-firebase-설정.json

# 파일이 없으면 Firebase Console에서 다시 다운로드
```

#### 오류: "Port 3000 already in use"
```bash
# Windows: 포트 사용 중인 프로세스 종료
netstat -ano | findstr :3000
taskkill //F //PID <PID번호>

# 또는 .env에서 포트 변경
PORT=3001
```

### Frontend가 Backend에 연결되지 않음

#### CORS 오류
```javascript
// backend/src/app.js 확인
// allowedOrigins에 frontend URL 추가
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (config.cors.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
```

#### API 호출 실패
```bash
# frontend/.env 확인
cat frontend/.env

# VITE_API_URL이 올바른지 확인
VITE_API_URL=http://localhost:3000/api
```

### 이메일이 발송되지 않음

#### Gmail 인증 실패
1. **2단계 인증 활성화 확인**
   - https://myaccount.google.com/security
   - 2단계 인증이 켜져있어야 함

2. **앱 비밀번호 재생성**
   - 기존 앱 비밀번호 삭제
   - 새로 생성 후 `.env` 업데이트

3. **"보안 수준이 낮은 앱" 설정 (구버전)**
   - Gmail에서 더 이상 지원하지 않음
   - 반드시 앱 비밀번호 사용

#### Backend 로그 확인
```bash
# 로그 파일 확인
tail -f backend/logs/combined.log

# 이메일 관련 오류 찾기
grep -i "email" backend/logs/combined.log
```

### 스크래핑이 동작하지 않음

#### Playwright 설치 확인
```bash
cd backend
npm install playwright
npx playwright install chromium
```

#### 스크래핑 로그 확인
```bash
# 최근 스크래핑 로그 확인
tail -n 50 backend/logs/combined.log | grep -i "scraping"
```

#### 수동 스크래핑 테스트
```javascript
// backend/src/app.js에 임시 코드 추가
import { scraperService } from './services/scraper.service.js';

// 서버 시작 후 1분 뒤 수동 스크래핑 실행
setTimeout(async () => {
  console.log('🧪 Manual scraping test...');
  try {
    const result = await scraperService.scrapeCampingSite();
    console.log('✅ Scraping success:', result);
  } catch (error) {
    console.error('❌ Scraping failed:', error);
  }
}, 60000);
```

---

## 다음 단계

### 📚 추가 문서 읽기

1. **[사용자 매뉴얼](docs/USER_MANUAL.md)**
   - 상세한 기능 사용법
   - UI 가이드
   - 알림 설정 팁

2. **[운영자 매뉴얼](docs/OPERATOR_MANUAL.md)**
   - 서버 배포 가이드
   - 모니터링 방법
   - 백업 및 복구

3. **[배포 가이드](docs/DEPLOYMENT_GUIDE.md)**
   - 프로덕션 배포
   - 환경 설정
   - 보안 체크리스트

4. **[API 문서](openapi.yaml)**
   - REST API 명세
   - 엔드포인트 설명
   - 요청/응답 예제

### 🔧 고급 설정

#### 1. 외부 접속 설정 (Cloudflare Tunnel)
```bash
# Cloudflare Tunnel로 외부에서 접속 가능
# 자세한 내용: docs/EXTERNAL_ACCESS_GUIDE.md
```

#### 2. 프로덕션 배포
```bash
# PM2로 프로세스 관리
npm install -g pm2
pm2 start backend/src/app.js --name camping-backend
pm2 startup
pm2 save
```

#### 3. 모니터링 설정
```bash
# 헬스 체크 엔드포인트
curl http://localhost:3000/health

# 상세 메트릭
curl http://localhost:3000/health/detailed
```

### 🎯 기여하기

프로젝트 개선에 기여하고 싶다면:

1. **이슈 제출**: https://github.com/kwhong/camping-reservation-notifier/issues
2. **Pull Request**: Fork → 수정 → PR 생성
3. **문서 개선**: 오타 수정, 번역, 예제 추가

### 💬 도움 받기

- **GitHub Issues**: 버그 리포트, 기능 제안
- **Discussions**: 질문, 아이디어 공유
- **이메일**: 프로젝트 관리자에게 문의

---

## 체크리스트

시작하기 전에 모든 항목을 확인하세요:

### 환경 설정
- [ ] Node.js 18.x 이상 설치
- [ ] npm 8.x 이상 설치
- [ ] Git 설치 (선택)

### Backend 설정
- [ ] `backend/.env` 파일 생성
- [ ] Gmail 계정 및 App Password 설정
- [ ] Firebase 서비스 계정 키 다운로드
- [ ] `camping-scraper-prod-firebase-설정.json` 파일 위치 확인
- [ ] `npm install` 실행 완료
- [ ] `npm start`로 서버 시작 성공

### Frontend 설정
- [ ] `frontend/.env` 파일 생성
- [ ] `VITE_API_URL` 설정
- [ ] Firebase 웹 앱 구성 정보 입력
- [ ] `npm install` 실행 완료
- [ ] `npm run dev`로 개발 서버 시작 성공

### Firebase 설정
- [ ] Firebase 프로젝트 생성
- [ ] Authentication 활성화 (이메일/비밀번호, Google)
- [ ] Firestore Database 생성
- [ ] 보안 규칙 설정
- [ ] 인덱스 배포 (`firebase deploy --only firestore:indexes`)

### 테스트
- [ ] Frontend 접속 확인 (http://localhost:5173/)
- [ ] 회원가입 및 로그인 성공
- [ ] 알림 설정 생성 가능
- [ ] 예약 가능 현황 조회 가능
- [ ] Backend 로그 확인 (`backend/logs/combined.log`)

---

## 빠른 참조

### 주요 명령어

```bash
# Backend 시작
cd backend && npm start

# Frontend 시작
cd frontend && npm run dev

# Backend 개발 모드 (자동 재시작)
cd backend && npm run dev

# 로그 실시간 확인
tail -f backend/logs/combined.log

# 헬스 체크
curl http://localhost:3000/health

# Firebase 인덱스 배포
cd backend && firebase deploy --only firestore:indexes

# 프로덕션 빌드 (Frontend)
cd frontend && npm run build
```

### 주요 URL

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **API Docs**: Swagger UI (openapi.yaml)
- **Firebase Console**: https://console.firebase.google.com/

### 주요 파일 위치

```
프로젝트/
├── backend/
│   ├── .env                              # 환경 변수 (생성 필요)
│   ├── src/app.js                        # Backend 엔트리 포인트
│   ├── logs/combined.log                 # 통합 로그
│   └── package.json
├── frontend/
│   ├── .env                              # 환경 변수 (생성 필요)
│   ├── src/
│   │   └── services/firebase.js          # Firebase 설정
│   └── package.json
├── camping-scraper-prod-firebase-설정.json  # Firebase 서비스 계정 (생성 필요)
├── openapi.yaml                          # API 명세서
└── GETTING_STARTED.md                    # 이 문서
```

---

🎉 **축하합니다!** 캠핑장 예약 알림 시스템을 시작할 준비가 완료되었습니다!

문제가 발생하면 [문제 해결](#문제-해결) 섹션을 참고하거나 GitHub Issues에 문의해주세요.
