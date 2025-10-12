# ADR-003: 미들웨어 기반 Firebase 인증

## 상태
채택됨 (Accepted)

## 컨텍스트
사용자 인증을 구현해야 하며, Firebase Authentication을 사용하기로 결정했습니다. 백엔드 API에서 클라이언트가 전송한 Firebase ID 토큰을 검증하는 방법을 선택해야 했습니다.

### 요구사항
- Firebase ID 토큰 검증
- 보호된 API 라우트와 공개 라우트 구분
- 사용자 정보를 후속 미들웨어/핸들러에 전달
- 에러 처리 일관성
- 코드 재사용성

### 고려한 옵션

#### 옵션 1: 각 라우트 핸들러에서 직접 검증
```javascript
router.get('/settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    // 비즈니스 로직...
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```
- **장점:**
  - 각 라우트의 인증 로직이 명확하게 보임
  - 라우트별 커스터마이징 용이
- **단점:**
  - 코드 중복 (DRY 원칙 위반)
  - 에러 처리 일관성 보장 어려움
  - 유지보수 비용 증가

#### 옵션 2: Express 미들웨어로 인증 구현
```javascript
// middleware/auth.middleware.js
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new AuthenticationError('No token provided');

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};

// routes/settings.routes.js
router.get('/settings', authenticateUser, async (req, res) => {
  const userId = req.user.uid; // 미들웨어가 설정한 값 사용
  // 비즈니스 로직...
});
```
- **장점:**
  - 코드 재사용성 극대화
  - 관심사 분리 (인증 vs 비즈니스 로직)
  - 에러 처리 중앙화
  - 테스트 용이성
- **단점:**
  - 추가 파일 및 구조 필요
  - Express 미들웨어 개념 이해 필요

#### 옵션 3: Passport.js 라이브러리 사용
- **장점:**
  - 검증된 인증 라이브러리
  - 다양한 전략(Strategy) 지원
- **단점:**
  - 추가 의존성 (passport, passport-firebase-jwt 등)
  - Firebase만 사용하는 프로젝트에는 과도함
  - 설정 복잡도 증가

## 결정
**Express 미들웨어 패턴**으로 Firebase 인증을 구현합니다.

### 구현 세부사항

#### 1. 인증 미들웨어 (`middleware/auth.middleware.js`)
```javascript
import admin from 'firebase-admin';
import { AuthenticationError } from '../utils/errors.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided', 'AUTH_NO_TOKEN');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 검증된 사용자 정보를 req 객체에 저장
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next(); // 다음 미들웨어로 진행
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      next(new AuthenticationError('Token expired', 'AUTH_TOKEN_EXPIRED'));
    } else if (error.code === 'auth/argument-error') {
      next(new AuthenticationError('Invalid token', 'AUTH_INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
};
```

#### 2. 라우트 적용 패턴
```javascript
// 보호된 라우트: 인증 필수
router.get('/settings', authenticateUser, asyncHandler(async (req, res) => {
  const userId = req.user.uid; // 미들웨어가 설정
  const settings = await firestoreService.getUserSettings(userId);
  res.json(settings);
}));

// 공개 라우트: 인증 불필요
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

#### 3. 에러 처리 통합
```javascript
// middleware/error.middleware.js
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      success: false,
      error: {
        message: err.message,
        code: err.code
      }
    });
  }
  // 기타 에러 처리...
};
```

### 결정 근거
1. **관심사 분리**: 인증 로직과 비즈니스 로직이 명확하게 분리됩니다. 라우트 핸들러는 인증이 완료된 상태에서만 실행되므로 비즈니스 로직에 집중할 수 있습니다.

2. **코드 재사용**: `authenticateUser` 미들웨어를 모든 보호된 라우트에 적용하여 중복 코드를 제거합니다.

3. **선언적 보안**: 라우트 정의 시 `authenticateUser`를 명시하여 해당 엔드포인트가 보호됨을 명확히 표현합니다.

4. **테스트 용이성**:
   - 미들웨어 단독 테스트 가능
   - 라우트 핸들러 테스트 시 `req.user` 모킹만으로 인증 우회 가능

5. **에러 처리 일관성**: 모든 인증 에러가 동일한 방식으로 처리되며, 중앙화된 에러 핸들러로 전달됩니다.

6. **확장성**: 향후 권한(authorization) 체크, 레이트 리미팅 등의 추가 미들웨어를 체인에 쉽게 추가할 수 있습니다.

## 결과
### 긍정적 영향
- **코드 품질**: 13개 API 엔드포인트에서 인증 코드 중복 제거
- **유지보수성**: 인증 로직 변경 시 단일 파일만 수정
- **명확한 보안 정책**: 라우트 정의만 보고 인증 필요 여부 즉시 파악
- **일관된 에러 응답**: 모든 인증 실패가 동일한 형식으로 응답

### 적용된 라우트
```javascript
// 인증 필요 라우트 (11개)
POST   /api/auth/verify
GET    /api/auth/profile
PUT    /api/auth/profile
GET    /api/settings
POST   /api/settings
PUT    /api/settings/:id
DELETE /api/settings/:id
GET    /api/availability
GET    /api/logs/notifications
GET    /api/logs/scraping
POST   /api/scheduler/run  // 관리자 전용 (추가 검증 필요)

// 인증 불필요 라우트 (1개)
GET    /api/health
```

### 보안 고려사항
1. **토큰 검증**: Firebase Admin SDK가 서명, 만료 시간, 발급자 자동 검증
2. **HTTPS 필수**: 프로덕션 환경에서 Bearer 토큰은 HTTPS로만 전송
3. **토큰 재사용 방지**: Firebase ID 토큰은 1시간 만료 (자동 갱신)
4. **Request ID 추적**: `requestIdMiddleware`와 결합하여 인증 실패 로그 추적 가능

### 성능 메트릭
- 토큰 검증 시간: 평균 20-30ms (Firebase 서버 왕복 시간)
- 캐싱 미적용: 매 요청마다 토큰 재검증 (보안 우선)
- 향후 개선 가능: Redis로 검증 결과 짧은 시간(1분) 캐싱 고려

## 향후 개선 방향
1. **권한 체크 미들웨어**: Role-based access control (RBAC)
   ```javascript
   router.post('/scheduler/run',
     authenticateUser,
     requireRole('admin'),  // 추가 미들웨어
     runSchedulerHandler
   );
   ```

2. **레이트 리미팅**: 사용자별 API 호출 제한
   ```javascript
   router.use('/api', authenticateUser, rateLimiter({ windowMs: 60000, max: 100 }));
   ```

3. **토큰 리프레시 자동화**: 클라이언트에서 만료 임박 시 자동 갱신

## 관련 결정
- [ADR-001: Express.js 선택](ADR-001-backend-framework-selection.md)
- [ADR-004: Firebase 선택](ADR-004-firebase-backend.md)
- [ADR-007: 에러 처리 아키텍처](ADR-007-error-handling-architecture.md)

## 참고자료
- [Firebase Admin Auth 가이드](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Express 미들웨어 가이드](https://expressjs.com/en/guide/using-middleware.html)
- [OWASP 인증 체크리스트](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---
**작성일**: 2024-01-16
**작성자**: Development Team
**최종 검토**: 2024-01-16
