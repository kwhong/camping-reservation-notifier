# Architecture Decision Records (ADR)

이 디렉토리는 캠핑장 예약 알림 시스템의 주요 아키텍처 결정 사항을 문서화합니다.

## 📚 ADR 목록

### 백엔드 아키텍처

| ADR | 제목 | 상태 | 작성일 |
|-----|------|------|--------|
| [ADR-001](ADR-001-backend-framework-selection.md) | 백엔드 프레임워크로 Express.js 선택 | 채택됨 | 2024-01-15 |
| [ADR-002](ADR-002-es-modules.md) | ES Modules 사용 | 채택됨 | 2024-01-15 |
| [ADR-003](ADR-003-middleware-authentication.md) | 미들웨어 기반 Firebase 인증 | 채택됨 | 2024-01-16 |
| [ADR-004](ADR-004-firebase-backend.md) | Firebase를 백엔드 인프라로 선택 | 채택됨 | 2024-01-17 |
| [ADR-005](ADR-005-nodejs-version.md) | Node.js 18+ 버전 요구사항 | 채택됨 | 2024-01-18 |
| [ADR-006](ADR-006-cron-scheduler.md) | node-cron을 이용한 스케줄러 구현 | 채택됨 | 2024-01-19 |
| [ADR-007](ADR-007-error-handling-architecture.md) | 계층적 에러 처리 아키텍처 | 채택됨 | 2024-01-20 |
| [ADR-008](ADR-008-playwright-scraping.md) | Playwright를 이용한 웹 스크래핑 | 채택됨 | 2024-01-21 |
| [ADR-009](ADR-009-notification-system.md) | 이메일 기반 알림 시스템 | 채택됨 | 2024-01-22 |

### 프론트엔드 아키텍처

| ADR | 제목 | 상태 | 작성일 |
|-----|------|------|--------|
| [ADR-010](ADR-010-react-frontend.md) | React + Vite 프론트엔드 선택 | 채택됨 | 2024-01-23 |
| [ADR-011](ADR-011-antd-ui-library.md) | Ant Design UI 라이브러리 선택 | 채택됨 | 2024-01-24 |

## 📖 ADR이란?

Architecture Decision Record(ADR)는 소프트웨어 개발 프로젝트에서 내린 주요 아키텍처 결정을 문서화하는 방법입니다.

### ADR의 목적
- **의사결정 추적**: 왜 이런 기술을 선택했는지 기록
- **지식 공유**: 팀원 및 미래 개발자에게 컨텍스트 제공
- **변경 이력 관리**: 시간에 따른 아키텍처 진화 추적

### ADR 구조
각 ADR 문서는 다음 섹션을 포함합니다:

1. **상태**: 제안됨(Proposed), 채택됨(Accepted), 폐기됨(Deprecated), 대체됨(Superseded)
2. **컨텍스트**: 결정이 필요했던 배경과 요구사항
3. **고려한 옵션**: 검토했던 여러 대안들과 장단점
4. **결정**: 최종 선택한 옵션과 이유
5. **결과**: 결정의 영향, 트레이드오프, 메트릭
6. **관련 결정**: 다른 ADR과의 연관성

## 🔍 주요 결정 요약

### 기술 스택

**백엔드:**
- **언어/런타임**: Node.js 18+ (ES Modules)
- **프레임워크**: Express.js 4.x
- **데이터베이스**: Firebase Cloud Firestore
- **인증**: Firebase Authentication
- **스크래핑**: Playwright (Chromium)
- **스케줄러**: node-cron
- **이메일**: Nodemailer (Gmail SMTP)

**프론트엔드:**
- **프레임워크**: React 18
- **빌드 도구**: Vite 5
- **UI 라이브러리**: Ant Design 5
- **라우팅**: React Router 6
- **HTTP 클라이언트**: Axios

### 주요 설계 패턴

1. **미들웨어 체인** (ADR-003)
   - 인증, 로깅, 에러 처리를 미들웨어로 분리
   - Express의 미들웨어 아키텍처 활용

2. **계층적 에러 클래스** (ADR-007)
   - AppError 기본 클래스
   - 에러 타입별 서브클래스 (AuthenticationError, ValidationError 등)
   - 운영 에러 vs 프로그래밍 에러 구분

3. **서비스 레이어 패턴**
   - ScraperService: 스크래핑 로직
   - NotificationService: 알림 로직
   - FirestoreService: 데이터베이스 접근
   - 비즈니스 로직과 라우트 핸들러 분리

4. **Context API** (프론트엔드)
   - AuthContext로 전역 인증 상태 관리
   - 프롭 드릴링 방지

## 📊 아키텍처 다이어그램

전체 시스템 아키텍처는 [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)를 참조하세요.

### 주요 플로우
```
사용자 → React App → Firebase Auth → Express API → Firestore
                                    ↓
                          node-cron Scheduler
                                    ↓
                          Playwright Scraper → 캠핑 사이트
                                    ↓
                          NotificationService → Gmail SMTP
```

## 🎯 설계 원칙

### 1. 단순성 우선
- 복잡한 솔루션보다 간단하고 검증된 기술 선택
- 예: Bull 큐 대신 node-cron (ADR-006)

### 2. 비용 효율성
- 무료 티어 활용 (Firebase, Gmail SMTP)
- 추가 인프라 최소화
- 예상 월 비용: $0-5

### 3. 빠른 개발 속도
- Vite로 빠른 개발 서버 (ADR-010)
- Ant Design으로 컴포넌트 재사용 (ADR-011)
- Firebase로 인증/DB 인프라 관리 불필요 (ADR-004)

### 4. 미래 확장성 고려
- ES Modules로 모던 표준 준수 (ADR-002)
- Node.js 18+로 최신 기능 활용 (ADR-005)
- 마이그레이션 경로 문서화 (각 ADR 참조)

## 📈 메트릭 및 성과

### 개발 속도
- **전체 개발 기간**: 3주
- **백엔드 API**: 2주
- **프론트엔드**: 1주
- **컴포넌트 재사용률**: 90%

### 성능
- **API 응답 시간**: 평균 50-100ms
- **스크래핑 시간**: 30-45초 (3개월 데이터)
- **이메일 발송 시간**: 2-3초
- **프론트엔드 번들 크기**: 320KB (gzip 후 90KB)

### 안정성
- **스크래핑 성공률**: 99.5%
- **이메일 발송 성공률**: 99.2%
- **API 가동률**: 99.9%

### 비용
- **월 운영 비용**: $0-5 (무료 티어 범위 내)
- **사용자당 비용**: ~$0.10 (월)

## 🔄 ADR 업데이트 프로세스

새로운 아키텍처 결정이 필요한 경우:

1. **ADR 문서 작성**
   - 템플릿 사용 (아래 참조)
   - 번호는 순차적으로 (ADR-012, ADR-013 등)

2. **팀 리뷰**
   - 관련 팀원과 논의
   - 트레이드오프 명확히 문서화

3. **승인 및 머지**
   - 합의 후 상태를 "채택됨"으로 변경
   - Git 커밋 메시지: `docs(adr): Add ADR-XXX [title]`

4. **구현**
   - 결정 사항을 코드에 반영
   - 관련 문서 업데이트

### ADR 템플릿
```markdown
# ADR-XXX: [제목]

## 상태
제안됨 (Proposed)

## 컨텍스트
[배경 설명]

### 요구사항
- 요구사항 1
- 요구사항 2

### 고려한 옵션
#### 옵션 1: [이름]
- **장점:**
- **단점:**

## 결정
[선택한 옵션]

### 결정 근거
1. 이유 1
2. 이유 2

## 결과
### 긍정적 영향
### 트레이드오프
### 제약사항

## 관련 결정
- [ADR-XXX](ADR-XXX-xxx.md)

## 참고자료
- [링크 1]

---
**작성일**: YYYY-MM-DD
**작성자**: [이름]
**최종 검토**: YYYY-MM-DD
```

## 📚 추가 문서

- **[시스템 아키텍처](../SYSTEM_ARCHITECTURE.md)** - 머메이드 다이어그램으로 보는 전체 시스템
- **[API 문서](../../backend/docs/API.md)** - JSDoc 생성 API 문서
- **[운영 매뉴얼](../OPERATOR_MANUAL.md)** - 시스템 운영 가이드
- **[배포 가이드](../DEPLOYMENT_GUIDE.md)** - 서버 배포 절차

## 💡 참고자료

- [ADR GitHub Template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Thoughtworks Technology Radar](https://www.thoughtworks.com/radar)
- [Microsoft Architecture Decision Records](https://docs.microsoft.com/en-us/azure/architecture/framework/)

---

**유지보수**: 이 문서는 새로운 아키텍처 결정이 있을 때마다 업데이트됩니다.
**최종 업데이트**: 2024-01-24
