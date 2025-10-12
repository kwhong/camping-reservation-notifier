# ADR-007: 계층적 에러 처리 아키텍처

## 상태
채택됨 (Accepted)

## 컨텍스트
Express 백엔드에서 다양한 유형의 에러(인증 실패, 데이터베이스 오류, 스크래핑 실패 등)를 일관되게 처리하고, 클라이언트에게 의미 있는 에러 응답을 제공해야 했습니다.

### 요구사항
- 에러 타입별 분류 (인증, DB, 스크래핑, 검증 등)
- 일관된 에러 응답 형식
- 적절한 HTTP 상태 코드
- 로깅 및 모니터링 지원
- 운영 에러 vs 프로그래밍 에러 구분
- 에러 스택 트레이스 (개발 환경에만)

### 고려한 옵션

#### 옵션 1: 기본 Error 객체만 사용
```javascript
throw new Error('User not found');
```
- **장점:**
  - 코드 단순함
  - 추가 구현 불필요
- **단점:**
  - 에러 타입 구분 불가
  - HTTP 상태 코드 지정 불가
  - 에러 처리 로직 중복
  - 클라이언트 응답 형식 불일치

#### 옵션 2: HTTP 에러 라이브러리 사용 (http-errors)
```javascript
import createError from 'http-errors';
throw createError(404, 'User not found');
```
- **장점:**
  - 간단한 사용법
  - HTTP 상태 코드 자동 설정
- **단점:**
  - 에러 타입 분류 제한적
  - 커스텀 에러 코드 추가 어려움
  - 비즈니스 로직 에러 표현 제한

#### 옵션 3: 커스텀 에러 클래스 계층 구조 ✅
```javascript
// 기본 에러 클래스
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

// 특정 에러 타입
class AuthenticationError extends AppError {
  constructor(message, code = 'AUTH_ERROR') {
    super(message, 401, code);
  }
}
```
- **장점:**
  - 에러 타입별 명확한 분류
  - 커스텀 속성 추가 용이
  - `instanceof`로 에러 타입 체크 가능
  - 에러 처리 로직 중앙화
- **단점:**
  - 초기 설정 필요
  - 여러 에러 클래스 관리

## 결정
**커스텀 에러 클래스 계층 구조**를 사용하여 에러 처리를 구현합니다.

### 에러 계층 구조
```
Error (JavaScript 기본)
  ↓
AppError (최상위 애플리케이션 에러)
  ├─ AuthenticationError (401)
  ├─ ValidationError (400)
  ├─ DatabaseError (500)
  ├─ ScraperError (500)
  ├─ EmailError (500)
  └─ RateLimitError (429)
```

### 결정 근거
1. **타입 안정성**: `instanceof` 체크로 에러 타입별 처리 가능
2. **일관된 응답**: 모든 에러가 동일한 형식으로 클라이언트에 전달
3. **에러 코드 체계**: HTTP 상태 코드 + 커스텀 에러 코드 조합
4. **운영 에러 구분**: `isOperational` 플래그로 예상 가능한 에러 식별
5. **중앙화된 처리**: Express 에러 핸들링 미들웨어에서 일괄 처리

## 구현 세부사항

### 1. 에러 클래스 정의 (`utils/errors.js`)
```javascript
/**
 * 기본 애플리케이션 에러 클래스
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // 운영 에러 (예상 가능한 에러)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 인증 에러 (401)
 */
export class AuthenticationError extends AppError {
  constructor(message, code = 'AUTH_ERROR') {
    super(message, 401, code);
  }
}

/**
 * 검증 에러 (400)
 */
export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

/**
 * 데이터베이스 에러 (500)
 */
export class DatabaseError extends AppError {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message, 500, code);
  }
}

/**
 * 스크래핑 에러 (500)
 */
export class ScraperError extends AppError {
  constructor(message, code = 'SCRAPER_ERROR') {
    super(message, 500, code);
  }
}

/**
 * 이메일 발송 에러 (500)
 */
export class EmailError extends AppError {
  constructor(message, code = 'EMAIL_ERROR') {
    super(message, 500, code);
  }
}

/**
 * 레이트 리미트 에러 (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
  }
}

/**
 * 운영 에러 여부 확인
 */
export const isOperationalError = (error) => {
  return error instanceof AppError && error.isOperational;
};
```

### 2. 에러 코드 정의 (`utils/errors.js`)
```javascript
/**
 * 표준 에러 코드
 */
export const ERROR_CODES = {
  // 인증 관련
  AUTH_NO_TOKEN: 'AUTH_NO_TOKEN',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // 검증 관련
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_DATE_RANGE: 'VALIDATION_INVALID_DATE_RANGE',

  // 데이터베이스 관련
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_DOCUMENT_NOT_FOUND: 'DATABASE_DOCUMENT_NOT_FOUND',

  // 스크래핑 관련
  SCRAPER_BROWSER_LAUNCH_FAILED: 'SCRAPER_BROWSER_LAUNCH_FAILED',
  SCRAPER_PAGE_LOAD_FAILED: 'SCRAPER_PAGE_LOAD_FAILED',
  SCRAPER_PARSING_FAILED: 'SCRAPER_PARSING_FAILED',

  // 이메일 관련
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  EMAIL_INVALID_ADDRESS: 'EMAIL_INVALID_ADDRESS',

  // 레이트 리미트
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // 기타
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND'
};
```

### 3. 에러 핸들링 미들웨어 (`middleware/error.middleware.js`)
```javascript
import logger from '../utils/logger.js';
import { isOperationalError } from '../utils/errors.js';

/**
 * 에러 응답 포맷팅
 */
export const formatErrorResponse = (err, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.errorCode || 'INTERNAL_ERROR',
      statusCode: err.statusCode || 500
    }
  };

  // 개발 환경에서만 스택 트레이스 포함
  if (includeStack && err.stack) {
    response.error.stack = err.stack;
  }

  return response;
};

/**
 * 404 핸들러 (라우트 없음)
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * 중앙 에러 핸들러
 */
export const errorHandler = (err, req, res, next) => {
  // 운영 에러가 아니면 경고 로깅
  if (!isOperationalError(err)) {
    logger.error('❌ Non-operational error occurred:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // 상태 코드 결정
  const statusCode = err.statusCode || 500;

  // 개발 환경 여부
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 에러 응답 생성
  const errorResponse = formatErrorResponse(err, isDevelopment);

  // 로깅 (운영 에러는 info, 프로그래밍 에러는 error)
  if (isOperationalError(err)) {
    logger.info(`⚠️  Operational error: ${err.errorCode} - ${err.message}`);
  } else {
    logger.error(`❌ Programming error: ${err.message}`, {
      stack: err.stack,
      path: req.path
    });
  }

  // 클라이언트 응답
  res.status(statusCode).json(errorResponse);
};

/**
 * Async 핸들러 래퍼 (try-catch 자동화)
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### 4. 에러 사용 예시
#### 라우트 핸들러
```javascript
import { asyncHandler } from '../middleware/error.middleware.js';
import { ValidationError, DatabaseError } from '../utils/errors.js';

// Async 핸들러로 래핑 (자동 에러 전달)
router.post('/settings', authenticateUser, asyncHandler(async (req, res) => {
  const { campingName, dateFrom, dateTo } = req.body;

  // 검증 에러
  if (!campingName) {
    throw new ValidationError(
      'Camping name is required',
      'VALIDATION_REQUIRED_FIELD'
    );
  }

  if (dateFrom > dateTo) {
    throw new ValidationError(
      'Invalid date range',
      'VALIDATION_INVALID_DATE_RANGE'
    );
  }

  // 비즈니스 로직
  try {
    const setting = await firestoreService.createUserSetting(req.user.uid, req.body);
    res.status(201).json({ success: true, data: setting });
  } catch (error) {
    throw new DatabaseError('Failed to create setting', 'DATABASE_QUERY_ERROR');
  }
}));
```

#### 서비스 레이어
```javascript
// scraper.service.js
import { ScraperError } from '../utils/errors.js';

export class ScraperService {
  async scrapeCampingSite(activeSettings) {
    let browser;
    try {
      browser = await chromium.launch();
    } catch (error) {
      throw new ScraperError(
        'Failed to launch browser',
        'SCRAPER_BROWSER_LAUNCH_FAILED'
      );
    }

    try {
      const page = await browser.newPage();
      await page.goto(TARGET_URL, { timeout: 30000 });
    } catch (error) {
      throw new ScraperError(
        `Failed to load page: ${error.message}`,
        'SCRAPER_PAGE_LOAD_FAILED'
      );
    } finally {
      await browser?.close();
    }
  }
}
```

### 5. Express 애플리케이션에 적용 (`app.js`)
```javascript
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// 라우트 등록
app.use('/api', apiRoutes);

// 404 핸들러 (마지막 라우트 다음)
app.use(notFoundHandler);

// 에러 핸들러 (가장 마지막)
app.use(errorHandler);

export default app;
```

## 결과
### 에러 응답 형식 (표준화)
#### 클라이언트가 받는 JSON 응답
```json
// 성공 응답
{
  "success": true,
  "data": { ... }
}

// 에러 응답 (운영 환경)
{
  "success": false,
  "error": {
    "message": "Camping name is required",
    "code": "VALIDATION_REQUIRED_FIELD",
    "statusCode": 400
  }
}

// 에러 응답 (개발 환경 - 스택 트레이스 포함)
{
  "success": false,
  "error": {
    "message": "Camping name is required",
    "code": "VALIDATION_REQUIRED_FIELD",
    "statusCode": 400,
    "stack": "ValidationError: Camping name is required\n    at ..."
  }
}
```

### HTTP 상태 코드 매핑
| 에러 클래스 | 상태 코드 | 의미 | 사용 예 |
|------------|---------|------|---------|
| AuthenticationError | 401 | 인증 실패 | 토큰 없음, 만료, 유효하지 않음 |
| ValidationError | 400 | 잘못된 요청 | 필수 필드 누락, 형식 오류 |
| DatabaseError | 500 | 서버 오류 | Firestore 쿼리 실패 |
| ScraperError | 500 | 서버 오류 | 브라우저 실행 실패, 파싱 오류 |
| EmailError | 500 | 서버 오류 | SMTP 연결 실패, 발송 실패 |
| RateLimitError | 429 | 과도한 요청 | API 호출 제한 초과 |
| AppError (NOT_FOUND) | 404 | 리소스 없음 | 라우트 없음, 문서 없음 |

### 긍정적 영향
1. **일관된 에러 응답**: 모든 API가 동일한 형식으로 에러 반환
2. **명확한 에러 식별**: 에러 코드로 클라이언트가 정확한 처리 가능
3. **디버깅 용이**: 개발 환경에서 스택 트레이스 자동 포함
4. **로깅 개선**: 운영 에러와 프로그래밍 에러 구분 로깅
5. **코드 간결화**: `asyncHandler`로 try-catch 보일러플레이트 제거

### 프론트엔드 에러 처리 패턴
```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// 응답 인터셉터로 에러 처리
api.interceptors.response.use(
  response => response,
  error => {
    const errorResponse = error.response?.data?.error;

    if (errorResponse) {
      // 에러 코드별 처리
      switch (errorResponse.code) {
        case 'AUTH_TOKEN_EXPIRED':
          // 토큰 재발급 로직
          break;
        case 'VALIDATION_REQUIRED_FIELD':
          // 폼 검증 에러 표시
          break;
        case 'RATE_LIMIT_EXCEEDED':
          // 레이트 리미트 경고
          break;
        default:
          // 일반 에러 메시지 표시
          console.error(errorResponse.message);
      }
    }

    return Promise.reject(error);
  }
);
```

### 로깅 예시
```
// 운영 에러 (예상 가능)
2024-01-20 10:30:15 [INFO] ⚠️  Operational error: VALIDATION_REQUIRED_FIELD - Camping name is required

// 프로그래밍 에러 (예상 불가)
2024-01-20 10:35:22 [ERROR] ❌ Programming error: Cannot read property 'uid' of undefined
  at getUserSettings (firestore.service.js:45:12)
  at async /api/settings (settings.routes.js:23:18)
```

### 재시도 로직 (일시적 에러)
```javascript
// utils/retry.js
import { DatabaseError, ScraperError } from './errors.js';

/**
 * 재시도 가능한 에러 판단
 */
export const isRetryableError = (error) => {
  if (error instanceof DatabaseError) {
    return error.errorCode === 'DATABASE_CONNECTION_ERROR';
  }
  if (error instanceof ScraperError) {
    return error.errorCode === 'SCRAPER_PAGE_LOAD_FAILED';
  }
  return false;
};

/**
 * 지수 백오프로 재시도
 */
export const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// 사용 예
const data = await retryWithBackoff(async () => {
  return await firestoreService.getActiveUserSettings();
});
```

## 제약사항 및 고려사항
### 1. 에러 메시지 노출
- **문제**: 민감한 정보가 에러 메시지에 포함될 수 있음
- **해결**: 운영 환경에서 일반적인 메시지 사용
  ```javascript
  if (process.env.NODE_ENV === 'production') {
    err.message = 'An error occurred';
  }
  ```

### 2. 에러 스택 트레이스
- **문제**: 스택 트레이스는 개발 정보 노출
- **해결**: 운영 환경에서 스택 트레이스 제외 (이미 구현됨)

### 3. 다국어 지원
- **향후 개선**: 에러 메시지 i18n 지원
  ```javascript
  class ValidationError extends AppError {
    constructor(messageKey, code) {
      super(i18n.t(messageKey), 400, code);
    }
  }
  ```

## 관련 결정
- [ADR-001: Express.js 선택](ADR-001-backend-framework-selection.md)
- [ADR-003: 미들웨어 기반 인증](ADR-003-middleware-authentication.md)

## 참고자료
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---
**작성일**: 2024-01-20
**작성자**: Development Team
**최종 검토**: 2024-01-20
