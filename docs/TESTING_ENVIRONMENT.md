# 테스트 환경 설정 가이드

생성일: 2025-10-12
버전: 1.0

## 📋 개요

이 문서는 프로덕션 환경과 분리된 안전한 테스트 환경을 구축하는 방법을 설명합니다.

---

## 🎯 테스트 환경 구조

```
Production Environment (camping-scraper-prod)
├── Firebase Project: camping-scraper-prod
├── Firestore: 실제 사용자 데이터
└── Domain: [프로덕션 도메인]

Development Environment (camping-scraper-dev)
├── Firebase Project: camping-scraper-dev
├── Firestore: 테스트 데이터
└── Domain: localhost:3000 / localhost:5173
```

---

## 🚀 Step 1: Firebase 개발 프로젝트 생성

### 1.1 Firebase Console에서 프로젝트 생성

1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `camping-scraper-dev`
4. Google Analytics 비활성화 (선택)
5. 프로젝트 생성 완료

### 1.2 Firestore 데이터베이스 생성

1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치: `asia-northeast3` (서울)
4. 보안 규칙: 테스트 모드로 시작
5. 생성 완료

### 1.3 Authentication 설정

1. Firebase Console > Authentication
2. "시작하기" 클릭
3. 로그인 제공업체 > Google 활성화
4. 이메일/비밀번호 활성화 (선택)

### 1.4 서비스 계정 키 생성

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드된 JSON 파일 저장:
   ```
   camping-scraper-dev-firebase-설정.json
   ```
4. 프로젝트 루트에 저장

---

## 🔧 Step 2: 환경 변수 설정

### 2.1 Backend 환경변수 생성

**파일: `backend/.env.development`**

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration (테스트용 Gmail 계정 사용 권장)
EMAIL_USER=test.camping.scraper@gmail.com
EMAIL_APP_PASSWORD=your_test_app_password

# Firebase Project
FIREBASE_PROJECT_ID=camping-scraper-dev
FIREBASE_SERVICE_ACCOUNT=../camping-scraper-dev-firebase-설정.json

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**주의:**
- 프로덕션과 다른 포트 사용 (3001)
- 테스트용 Gmail 계정 사용
- 개발용 Firebase 프로젝트 지정

### 2.2 Frontend 환경변수 생성

**파일: `frontend/.env.development`**

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Firebase Configuration (개발 프로젝트)
VITE_FIREBASE_API_KEY=your_dev_api_key
VITE_FIREBASE_AUTH_DOMAIN=camping-scraper-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=camping-scraper-dev
VITE_FIREBASE_STORAGE_BUCKET=camping-scraper-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
VITE_FIREBASE_APP_ID=your_dev_app_id
```

### 2.3 환경변수 로딩 설정

**backend/src/config/firebase.js 수정:**

```javascript
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initializeFirebase = () => {
  try {
    // 환경에 따라 다른 서비스 계정 사용
    const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT ||
      '../../../camping-scraper-prod-firebase-설정.json';

    const serviceAccountPath = join(__dirname, serviceAccountFile);
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    // ... (나머지 코드)
  }
};
```

---

## 📦 Step 3: 테스트 데이터 준비

### 3.1 테스트 데이터 시드 스크립트

**파일: `backend/scripts/seed-test-data.js`**

```javascript
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 개발 환경 Firebase 초기화
const serviceAccountPath = join(__dirname, '../../camping-scraper-dev-firebase-설정.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  // 1. 테스트 사용자 생성
  const testUsers = [
    {
      id: 'test-user-1',
      email: 'test1@example.com',
      displayName: '테스트 사용자 1',
      notificationEmail: 'test1@example.com',
      createdAt: new Date()
    },
    {
      id: 'test-user-2',
      email: 'test2@example.com',
      displayName: '테스트 사용자 2',
      notificationEmail: 'test2@example.com',
      createdAt: new Date()
    }
  ];

  for (const user of testUsers) {
    await db.collection('users').doc(user.id).set(user);
    console.log(`✅ Created user: ${user.email}`);
  }

  // 2. 테스트 사용자 설정 생성
  const testSettings = [
    {
      userId: 'test-user-1',
      campingName: '다리안계곡캠핑장',
      region: '충북 단양',
      area: ['데크A', '데크B'],
      dateFrom: '2025-11-01',
      dateTo: '2025-11-05',
      isActive: true,
      createdAt: new Date()
    },
    {
      userId: 'test-user-2',
      campingName: '다리안계곡캠핑장',
      region: '충북 단양',
      area: [],
      dateFrom: '2025-12-20',
      dateTo: '2025-12-25',
      isActive: true,
      createdAt: new Date()
    }
  ];

  for (const setting of testSettings) {
    const docRef = await db.collection('userSettings').add(setting);
    console.log(`✅ Created setting: ${docRef.id}`);
  }

  // 3. 샘플 예약 가능 데이터 생성
  const testAvailability = [
    {
      campingName: '다리안계곡캠핑장',
      region: '충북 단양',
      area: '데크A',
      date: '2025-11-01',
      availableCount: 2,
      scrapedAt: new Date()
    },
    {
      campingName: '다리안계곡캠핑장',
      region: '충북 단양',
      area: '데크B',
      date: '2025-11-01',
      availableCount: 1,
      scrapedAt: new Date()
    },
    {
      campingName: '다리안계곡캠핑장',
      region: '충북 단양',
      area: '원두막',
      date: '2025-11-02',
      availableCount: 0,
      scrapedAt: new Date()
    }
  ];

  for (const availability of testAvailability) {
    await db.collection('availability').add(availability);
    console.log(`✅ Created availability: ${availability.area} on ${availability.date}`);
  }

  console.log('\n✅ Test data seeding completed!');
}

seedTestData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
```

### 3.2 테스트 데이터 생성 실행

```bash
cd backend
node scripts/seed-test-data.js
```

---

## 🧪 Step 4: 로컬 테스트 실행

### 4.1 Backend 개발 서버 실행

```bash
cd backend

# 개발 환경변수 로드
export NODE_ENV=development
# Windows에서:
set NODE_ENV=development

# 서버 시작 (nodemon 사용)
npm run dev
```

**확인:**
- 서버가 포트 3001에서 실행되는지 확인
- Firebase Dev 프로젝트 연결 확인
- 헬스체크: `curl http://localhost:3001/health`

### 4.2 Frontend 개발 서버 실행

```bash
cd frontend

# 개발 서버 시작
npm run dev
```

**확인:**
- 프론트엔드가 포트 5173에서 실행
- API 호출이 localhost:3001로 가는지 확인
- 브라우저 콘솔에 에러 없는지 확인

### 4.3 수동 스크래핑 테스트

**파일: `backend/scripts/test-scraper-local.js`**

```javascript
import { scraperService } from '../src/services/scraper.service.js';
import { firestoreService } from '../src/services/firestore.service.js';
import dotenv from 'dotenv';

// 개발 환경변수 로드
dotenv.config({ path: '.env.development' });

async function testScraper() {
  console.log('🧪 Testing scraper locally...');

  try {
    // 테스트 설정 조회
    const activeSettings = await firestoreService.getAllActiveSettings();
    console.log(`Found ${activeSettings.length} active settings`);

    // 스크래핑 실행
    const itemsScraped = await scraperService.scrapeCampingSite(activeSettings);
    console.log(`✅ Scraped ${itemsScraped} items successfully`);

  } catch (error) {
    console.error('❌ Scraper test failed:', error);
  }
}

testScraper();
```

**실행:**
```bash
cd backend
node scripts/test-scraper-local.js
```

### 4.4 알림 테스트

**파일: `backend/scripts/test-notification-local.js`**

```javascript
import { notificationService } from '../src/services/notification.service.js';
import { firestoreService } from '../src/services/firestore.service.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function testNotification() {
  console.log('🧪 Testing notification locally...');

  try {
    // 최근 예약 가능 데이터 조회
    const availability = await firestoreService.getAvailability({ limit: 10 });
    console.log(`Found ${availability.length} availability records`);

    // 알림 확인
    await notificationService.checkAndNotify(availability);
    console.log('✅ Notification check completed');

  } catch (error) {
    console.error('❌ Notification test failed:', error);
  }
}

testNotification();
```

**실행:**
```bash
node scripts/test-notification-local.js
```

---

## 🔍 Step 5: 테스트 시나리오

### 5.1 사용자 인증 테스트

1. 프론트엔드 접속: http://localhost:5173
2. Google 로그인 시도
3. 개발 Firebase 프로젝트로 인증되는지 확인
4. Firestore > users 컬렉션에 사용자 생성 확인

### 5.2 설정 CRUD 테스트

1. "사용자 설정" 메뉴 접속
2. 새 설정 추가
3. 설정 수정
4. 설정 삭제
5. 각 작업 후 Firestore 확인

### 5.3 스크래핑 테스트

1. 수동 스크래핑 스크립트 실행
2. Firestore > availability 컬렉션 확인
3. Firestore > scrapingLogs 확인
4. 에러 로그 확인

### 5.4 알림 테스트

1. 알림 트리거 조건 만족하는 데이터 생성
2. 알림 테스트 스크립트 실행
3. 테스트 이메일 수신 확인
4. Firestore > notifications 컬렉션 확인

---

## 📊 테스트 데이터 관리

### 데이터 초기화

```bash
# 모든 컬렉션 삭제 (주의!)
node scripts/clear-test-data.js

# 테스트 데이터 재생성
node scripts/seed-test-data.js
```

### 프로덕션 데이터 복사 (선택)

```bash
# 프로덕션 데이터 백업
node scripts/backup-firestore.js

# 개발 환경에 복사 (민감정보 제거 필요)
node scripts/copy-to-dev.js --backup-id=TIMESTAMP --sanitize
```

---

## ⚠️ 주의사항

### 절대 하지 말아야 할 것

1. **개발 환경에서 프로덕션 Firebase 프로젝트 사용 금지**
2. **프로덕션 이메일로 테스트 알림 발송 금지**
3. **테스트 코드에 프로덕션 서비스 계정 키 포함 금지**
4. **개발 환경변수를 Git에 커밋 금지**

### 권장 사항

1. 테스트용 Gmail 계정 별도 생성
2. 개발 Firebase 프로젝트에 팀원 초대
3. 주기적으로 테스트 데이터 정리
4. 테스트 실행 전 환경변수 확인

---

## 🐛 문제 해결

### 문제: Firebase 인증 실패

```
Error: Could not load the default credentials
```

**해결:**
1. 서비스 계정 키 경로 확인
2. 환경변수 `FIREBASE_SERVICE_ACCOUNT` 확인
3. JSON 파일 권한 확인

### 문제: 포트 충돌

```
Error: listen EADDRINUSE: address already in use :::3001
```

**해결:**
```bash
# 프로세스 확인
lsof -i :3001
# Windows에서:
netstat -ano | findstr :3001

# 프로세스 종료
kill -9 <PID>
# Windows에서:
taskkill /PID <PID> /F
```

### 문제: CORS 에러

```
Access to XMLHttpRequest blocked by CORS policy
```

**해결:**
1. Backend CORS 설정 확인
2. Frontend API URL 확인
3. 브라우저 캐시 삭제

---

## 📚 추가 리소스

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore 에뮬레이터](https://firebase.google.com/docs/emulator-suite)
- [Vite 환경변수](https://vitejs.dev/guide/env-and-mode.html)

**마지막 업데이트**: 2025-10-12
**문서 버전**: 1.0
