# ADR-004: Firebase를 백엔드 인프라로 선택

## 상태
채택됨 (Accepted)

## 컨텍스트
캠핑장 예약 알림 시스템의 백엔드 인프라를 구축하기 위해 사용자 인증, 데이터베이스, 호스팅을 제공하는 플랫폼을 선택해야 했습니다.

### 요구사항
- 사용자 인증 (이메일/비밀번호, OAuth)
- NoSQL 데이터베이스 (스키마 유연성)
- 실시간 데이터 동기화 (선택)
- 빠른 개발 및 배포
- 낮은 초기 비용
- 확장 가능성

### 고려한 옵션

#### 옵션 1: Firebase (Google Cloud Platform)
- **구성요소:**
  - Firebase Authentication (사용자 인증)
  - Cloud Firestore (NoSQL 데이터베이스)
  - Firebase Admin SDK (서버 측 관리)
- **장점:**
  - 완전 관리형 서비스 (인프라 관리 불필요)
  - 프론트엔드/백엔드 SDK 일체형
  - 이메일/비밀번호, Google OAuth 기본 제공
  - 무료 티어 제공 (소규모 프로젝트에 충분)
  - 자동 확장
  - 실시간 리스너 지원
- **단점:**
  - 벤더 종속성 (Firebase → 다른 DB 마이그레이션 어려움)
  - 복잡한 쿼리 제한 (조인 불가, 복합 인덱스 필요)
  - Firestore 비용이 읽기/쓰기 수에 비례

#### 옵션 2: AWS (Cognito + DynamoDB)
- **구성요소:**
  - AWS Cognito (사용자 인증)
  - DynamoDB (NoSQL 데이터베이스)
- **장점:**
  - 엔터프라이즈급 확장성
  - AWS 생태계와 통합 용이
  - 세밀한 권한 제어 (IAM)
- **단점:**
  - 설정 및 학습 곡선 가파름
  - 프론트엔드/백엔드 SDK 분리
  - 초기 설정 복잡도 높음
  - 무료 티어 제한적

#### 옵션 3: 자체 구축 (PostgreSQL + Passport.js)
- **구성요소:**
  - PostgreSQL (관계형 데이터베이스)
  - Passport.js (인증 라이브러리)
  - bcrypt (비밀번호 해싱)
- **장점:**
  - 완전한 제어 가능
  - 벤더 종속성 없음
  - 복잡한 관계형 쿼리 지원
- **단점:**
  - 인프라 직접 관리 필요 (백업, 확장, 보안)
  - 개발 시간 증가 (인증 시스템 직접 구현)
  - OAuth 통합 수동 구현
  - 초기 비용 (서버 호스팅)

## 결정
**Firebase (Authentication + Firestore)**를 백엔드 인프라로 선택합니다.

### 아키텍처 구성
```
Frontend (React)
  ↓ Firebase Client SDK
Firebase Authentication
  ↓ ID Token
Backend (Express)
  ↓ Firebase Admin SDK
Cloud Firestore
```

### 결정 근거
1. **빠른 MVP 출시**: Firebase의 완전 관리형 서비스로 인프라 설정 시간을 절약하고, 비즈니스 로직 개발에 집중할 수 있습니다.

2. **통합 인증 시스템**: Firebase Authentication은 이메일/비밀번호, Google OAuth를 기본 제공하며, 클라이언트와 서버 SDK가 완벽하게 통합됩니다.

3. **스키마 유연성**: 캠핑장 예약 데이터 구조가 유동적이며, Firestore의 NoSQL 특성이 요구사항 변화에 빠르게 대응할 수 있습니다.

4. **비용 효율성**:
   - 예상 트래픽: 일 사용자 50명, 월 1,500명
   - 스크래핑 데이터: 월 약 100,000 문서 쓰기
   - 사용자 설정 조회: 월 약 50,000 읽기
   - **예상 비용: 월 $0-5 (무료 티어 범위 내)**

5. **프론트엔드 통합**: React 프론트엔드에서 Firebase Client SDK로 직접 인증하고, ID 토큰을 백엔드로 전달하는 패턴이 명확합니다.

6. **보안**: Firebase Authentication은 ID 토큰 서명/검증을 자동 처리하며, Firestore Security Rules로 데이터 접근 제어가 가능합니다.

## 결과
### 구현된 Firebase 구성

#### 1. Firebase Admin SDK 초기화 (`config/firebase.js`)
```javascript
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, '../../../camping-scraper-prod-firebase-설정.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
export default admin;
```

#### 2. Firestore 컬렉션 구조
```javascript
// collections
users/                   // 사용자 프로필
  {userId}/
    - email: string
    - displayName: string
    - notificationEmail: string
    - createdAt: Timestamp
    - updatedAt: Timestamp

userSettings/            // 사용자 설정
  {settingId}/
    - userId: string
    - campingName: string
    - region: string
    - area: string[]
    - dateFrom: string (YYYY-MM-DD)
    - dateTo: string (YYYY-MM-DD)
    - isActive: boolean
    - createdAt: Timestamp
    - updatedAt: Timestamp

availability/            // 예약 가능 현황
  {availabilityId}/
    - campingName: string
    - region: string
    - area: string
    - date: string (YYYY-MM-DD)
    - availableCount: number
    - scrapedAt: Timestamp

notifications/           // 알림 이력
  {notificationId}/
    - userId: string
    - settingId: string
    - campingName: string
    - region: string
    - area: string
    - date: string
    - notificationType: 'email'
    - sentAt: Timestamp
    - emailSentTo: string

scrapingLogs/           // 스크래핑 로그
  {logId}/
    - startedAt: Timestamp
    - completedAt: Timestamp
    - status: 'success' | 'error' | 'running'
    - itemsScraped: number
    - errorMessage: string (optional)
```

#### 3. Firestore 서비스 레이어 (`services/firestore.service.js`)
주요 함수:
- `createOrUpdateUser(uid, userData)`
- `getUserSettings(userId)`
- `createUserSetting(userId, settingData)`
- `saveAvailabilityBatch(availabilityData)`
- `getActiveUserSettings()`
- `logNotification(notificationData)`
- `getScrapingLogs(limit)`

### 긍정적 영향
1. **개발 속도**: 인증 시스템 구현 없이 3일 만에 사용자 관리 완료
2. **보안**: Firebase Admin SDK의 토큰 검증으로 안전한 API 보호
3. **실시간 가능성**: 향후 실시간 알림 추가 시 Firestore 리스너 활용 가능
4. **자동 확장**: 사용자 증가 시 인프라 관리 불필요

### 발생한 제약사항과 해결
1. **복잡한 쿼리 제한**
   - **문제**: Firestore는 여러 필드에 대한 복합 쿼리 시 복합 인덱스 필요
   - **예시**: `availability` 컬렉션에서 campingName, region, date 범위 조회
   - **해결**:
     ```javascript
     // Firestore 콘솔에서 복합 인덱스 생성
     // Collection: availability
     // Fields: campingName (Ascending), region (Ascending), date (Ascending)

     const query = db.collection('availability')
       .where('campingName', '==', campingName)
       .where('region', '==', region)
       .where('date', '>=', startDate)
       .where('date', '<=', endDate);
     ```

2. **배치 쓰기 제한 (500개)**
   - **문제**: Firestore 배치 작업은 최대 500개 문서까지만 가능
   - **해결**: 500개씩 분할하여 배치 처리
     ```javascript
     const BATCH_SIZE = 500;
     for (let i = 0; i < availabilityData.length; i += BATCH_SIZE) {
       const batch = db.batch();
       const chunk = availabilityData.slice(i, i + BATCH_SIZE);
       chunk.forEach(item => {
         const docRef = db.collection('availability').doc();
         batch.set(docRef, item);
       });
       await batch.commit();
     }
     ```

3. **타임스탬프 객체 처리**
   - **문제**: Firestore Timestamp는 `{ seconds, nanoseconds }` 객체 반환
   - **해결**: 프론트엔드 전송 전 Date로 변환
     ```javascript
     const formatTimestamp = (timestamp) => {
       if (timestamp?.toDate) return timestamp.toDate();
       if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
       return timestamp;
     };
     ```

4. **중복 데이터 방지**
   - **문제**: 동일한 예약 가능 현황이 중복 저장될 수 있음
   - **해결**: 복합 키로 문서 ID 생성
     ```javascript
     const docId = `${campingName}_${region}_${area}_${date}`;
     await db.collection('availability').doc(docId).set(data, { merge: true });
     ```

### 비용 분석 (실제 사용량 기준)
**무료 티어 한도:**
- 문서 읽기: 50,000 / 일
- 문서 쓰기: 20,000 / 일
- 문서 삭제: 20,000 / 일
- 저장 용량: 1GB

**예상 사용량 (월간):**
- 스크래핑 쓰기: ~90,000 (3,000/일 × 30일)
- 사용자 설정 읽기: ~30,000 (1,000/일 × 30일)
- 알림 로그 쓰기: ~1,500 (50/일 × 30일)
- 저장 용량: ~100MB

**결과: 완전히 무료 티어 범위 내 (초과 비용 없음)**

### 보안 설정
#### Firestore Security Rules (예시)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필: 본인만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 사용자 설정: 본인만 읽기/쓰기
    match /userSettings/{settingId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    // 예약 가능 현황: 인증된 사용자 읽기 전용
    match /availability/{availabilityId} {
      allow read: if request.auth != null;
      allow write: if false; // 백엔드만 쓰기 가능
    }

    // 알림 이력: 본인만 읽기
    match /notifications/{notificationId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow write: if false; // 백엔드만 쓰기 가능
    }
  }
}
```

## 대안 및 마이그레이션 경로
향후 확장 시 고려사항:
1. **MongoDB Atlas로 마이그레이션**: 복잡한 집계 쿼리 필요 시
2. **PostgreSQL 추가**: 분석 쿼리용 읽기 전용 복제본
3. **Firebase + Cache 레이어**: Redis로 자주 조회되는 데이터 캐싱

## 관련 결정
- [ADR-003: 미들웨어 기반 인증](ADR-003-middleware-authentication.md)
- [ADR-008: Playwright 스크래핑](ADR-008-playwright-scraping.md)

## 참고자료
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 데이터 모델 가이드](https://firebase.google.com/docs/firestore/data-model)
- [Firebase 가격 정책](https://firebase.google.com/pricing)
- [Firestore 쿼리 제한사항](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)

---
**작성일**: 2024-01-17
**작성자**: Development Team
**최종 검토**: 2024-01-17
