# ADR-001: 백엔드 프레임워크로 Express.js 선택

## 상태
채택됨 (Accepted)

## 컨텍스트
캠핑장 예약 알림 시스템의 백엔드를 구축하기 위해 적절한 Node.js 웹 프레임워크를 선택해야 했습니다.

### 요구사항
- RESTful API 서버 구축
- Firebase Admin SDK와의 통합
- 스케줄러 및 스크래핑 서비스 실행
- 미들웨어 기반 인증 처리
- 에러 핸들링 및 로깅

### 고려한 옵션

#### 옵션 1: Express.js
- **장점:**
  - 가장 널리 사용되는 Node.js 프레임워크 (성숙한 생태계)
  - 미들웨어 아키텍처로 유연한 확장 가능
  - 경량화되어 있고 학습 곡선이 낮음
  - 대규모 커뮤니티와 풍부한 문서
  - Firebase Admin SDK와의 통합 예제 풍부
- **단점:**
  - 기본 기능이 최소화되어 있어 추가 패키지 필요
  - 프로젝트 구조를 직접 설계해야 함

#### 옵션 2: Fastify
- **장점:**
  - Express보다 성능이 우수 (벤치마크 기준 약 2배)
  - TypeScript 친화적
  - 스키마 기반 검증 내장
- **단점:**
  - 상대적으로 작은 커뮤니티
  - Firebase와의 통합 예제 부족
  - 미들웨어 생태계가 Express보다 제한적

#### 옵션 3: NestJS
- **장점:**
  - TypeScript 기본 지원
  - Angular와 유사한 구조화된 아키텍처
  - 의존성 주입(DI) 내장
  - 엔터프라이즈급 기능 제공
- **단점:**
  - 학습 곡선이 가파름
  - 작은 프로젝트에는 과도한 보일러플레이트
  - TypeScript 필수 (팀 기술 스택과 불일치)

## 결정
**Express.js 4.x**를 백엔드 프레임워크로 선택했습니다.

### 결정 근거
1. **신속한 개발**: 프로젝트는 빠른 프로토타이핑과 MVP 출시가 우선이었습니다. Express의 간결함과 낮은 학습 곡선이 적합했습니다.

2. **Firebase 생태계 호환성**: Firebase Admin SDK의 대부분 예제와 튜토리얼이 Express 기반이며, 인증 미들웨어 패턴이 잘 정립되어 있습니다.

3. **미들웨어 아키텍처**: 인증(`authenticateUser`), 로깅(`logRequestMiddleware`), 에러 핸들링(`errorHandler`) 등 미들웨어 체인으로 관심사를 명확히 분리할 수 있습니다.

4. **팀 기술 스택**: JavaScript(ES modules)를 사용하는 프로젝트이며, TypeScript 도입 계획이 없어 Express가 가장 자연스러운 선택이었습니다.

5. **충분한 성능**: 이 시스템은 동시 사용자 수가 많지 않고(수백 명 수준), 10분마다 실행되는 스케줄러가 주요 워크로드입니다. Express의 성능으로 충분합니다.

## 결과
### 긍정적 영향
- **빠른 개발 속도**: 2주 내에 전체 백엔드 API 구축 완료
- **명확한 코드 구조**: 미들웨어 체인으로 인증, 로깅, 에러 처리가 명확하게 분리됨
- **Firebase 통합 원활**: `firebase-admin` 패키지와 완벽한 호환성
- **낮은 유지보수 비용**: 팀원 누구나 코드 이해 가능

### 트레이드오프
- **수동 구조 설계**: 폴더 구조, 서비스 레이어, 라우트 구성을 직접 설계해야 했음
  - 해결: `routes/`, `services/`, `middleware/`, `utils/` 구조로 명확하게 구성
- **타입 안정성 부족**: JavaScript 사용으로 컴파일 타임 타입 체크 없음
  - 완화: JSDoc으로 타입 힌트 제공, 철저한 입력 검증

### 메트릭
- API 응답 시간: 평균 50-100ms (Firebase 쿼리 제외)
- 메모리 사용량: 약 100MB (Playwright 제외)
- 개발 생산성: 주당 평균 15개 API 엔드포인트 구현

## 관련 결정
- [ADR-002: ES Modules 사용](ADR-002-es-modules.md)
- [ADR-003: 미들웨어 기반 인증](ADR-003-middleware-authentication.md)
- [ADR-007: 에러 처리 아키텍처](ADR-007-error-handling-architecture.md)

## 참고자료
- [Express.js 공식 문서](https://expressjs.com/)
- [Firebase Admin + Express 예제](https://firebase.google.com/docs/admin/setup)
- [Node.js 프레임워크 벤치마크](https://github.com/fastify/benchmarks)

---
**작성일**: 2024-01-15
**작성자**: Development Team
**최종 검토**: 2024-01-15
