# 캠핑장 알림 시스템 - 단계적 개선 계획

생성일: 2025-10-12
버전: 1.0

## 📊 현황 분석

### 시스템 현재 상태
- **운영 환경**: 프로덕션 운영 중 (스케줄러 10분마다 실행)
- **사용자 영향도**: 높음 (실시간 알림 시스템)
- **데이터베이스**: Firestore (활성 데이터 존재)
- **외부 의존성**: Gmail SMTP, Firebase Auth, Playwright

### 위험도 평가
```
High Risk (서비스 중단 가능):
- 인증 시스템 변경
- Firestore 스키마 변경
- 스케줄러 로직 수정

Medium Risk (부분 장애 가능):
- API 엔드포인트 변경
- 알림 로직 수정

Low Risk (무중단 적용 가능):
- 로깅 개선
- 코드 리팩토링
- 새 기능 추가
```

---

## 🎯 단계별 실행 계획

### **Phase 0: 준비 단계 (1-2일)**
> 목표: 안전한 개선을 위한 기반 구축

#### Step 0.1: 백업 및 안전장치 마련
```
✓ Git 브랜치 전략 수립
  - main: 프로덕션
  - develop: 개발
  - feature/security-fixes
  - feature/performance-optimization

✓ 데이터 백업
  - Firestore 데이터 export
  - 환경변수 백업
  - Firebase 서비스 계정 키 백업

✓ 모니터링 설정
  - 에러 로그 수집 메커니즘
  - 스케줄러 실행 상태 모니터링
```

**산출물:**
- `docs/ROLLBACK_PLAN.md`
- `scripts/backup-firestore.js`
- `.github/workflows/backup.yml`

#### Step 0.2: 테스트 환경 구축
```
✓ 개발 환경 Firebase 프로젝트 생성
  - camping-scraper-dev

✓ 테스트 데이터 세트 준비
  - Mock 사용자 설정
  - Mock 스크래핑 결과

✓ 로컬 테스트 스크립트 작성
  - backend/scripts/test-scraper-local.js
  - backend/scripts/test-notification-local.js
```

**산출물:**
- `backend/.env.development`
- `backend/scripts/seed-test-data.js`
- `docs/TESTING_ENVIRONMENT.md`

---

### **Phase 1: 긴급 보안 패치 (1일, 즉시 실행)**
> 목표: 치명적인 보안 취약점 제거 (Hot Fix)

#### Step 1.1: 민감정보 제거 (30분)
```
Priority: CRITICAL
Risk: Low (코드 변경 최소)

작업:
1. backend/src/config/email.js:13 주석 제거
2. Git 히스토리 스캔 (.env 파일 커밋 여부 확인)
3. 노출된 경우 즉시 비밀번호 재발급
```

**체크리스트:**
- [ ] 코드에서 민감정보 제거
- [ ] `.gitignore`에 `.env` 포함 확인
- [ ] Git 히스토리 확인 (`git log --all --full-history -- "*/.env"`)
- [ ] 필요시 Gmail App Password 재발급

#### Step 1.2: Authorization 검증 추가 (2시간)
```
Priority: CRITICAL
Risk: Medium (API 동작 변경)

파일:
- backend/src/services/firestore.service.js (getUserSetting 메서드 추가)
- backend/src/routes/settings.routes.js (검증 로직 추가)
- backend/src/routes/availability.routes.js (필요시)
```

**구현 순서:**
1. FirestoreService에 `getUserSetting(settingId)` 메서드 추가
2. Settings routes에 소유권 검증 미들웨어 추가
3. 단위 테스트 작성 (Jest)
4. 개발 환경에서 테스트
5. 프로덕션 배포

**테스트 시나리오:**
- [ ] 자신의 설정 수정 가능
- [ ] 타인의 설정 수정 시 403 에러
- [ ] 존재하지 않는 설정 접근 시 404 에러

#### Step 1.3: CORS 설정 강화 (15분)
```
Priority: HIGH
Risk: Low

파일:
- backend/src/app.js
- backend/.env (FRONTEND_URL 추가)
```

**배포 전 확인사항:**
- [ ] 개발 환경에서 정상 동작 확인
- [ ] 프로덕션 Frontend URL 환경변수 설정
- [ ] Cloudflare Tunnel URL도 허용 목록에 추가

**산출물:**
- `SECURITY_PATCH_v1.0.md` (패치 노트)
- Git tag: `security-patch-v1.0`

---

### **Phase 2: 데이터 무결성 개선 (2-3일)**
> 목표: 중복 데이터 제거 및 쿼리 최적화

#### Step 2.1: 데이터 중복 분석 (1시간)
```
작업:
1. 현재 Firestore availability 컬렉션 데이터 분석
2. 중복 레코드 수 파악
3. 스토리지 사용량 측정
```

**스크립트:**
```javascript
// scripts/analyze-duplicates.js
// - 날짜별/구역별 중복 카운트
// - 총 문서 수 vs 고유 데이터 수
```

#### Step 2.2: Upsert 로직 구현 (2시간)
```
Priority: HIGH
Risk: Medium

파일:
- backend/src/services/firestore.service.js
- backend/src/services/scraper.service.js
```

**마이그레이션 전략:**
```
A/B 방식:
1. 새 메서드 추가 (saveAvailabilityV2)
2. 스케줄러에서 병렬 실행 (기존 + 새 방식)
3. 1주일 모니터링
4. 문제 없으면 기존 메서드 제거
```

**테스트:**
- [ ] 같은 데이터 2번 저장 시 문서 1개만 생성
- [ ] 기존 데이터 업데이트 정상 동작
- [ ] scrapedAt 타임스탬프 갱신 확인

#### Step 2.3: 기존 중복 데이터 정리 (1시간)
```
작업:
1. 백업 먼저 수행
2. 중복 데이터 삭제 스크립트 실행 (dry-run)
3. 결과 확인 후 실제 삭제
```

**스크립트:**
```javascript
// scripts/cleanup-duplicates.js
// - 각 (campingName, region, area, date) 조합당 최신 1개만 유지
// - 삭제된 문서 수 리포트
```

#### Step 2.4: Firestore 인덱스 생성 (30분)
```
파일:
- firestore.indexes.json (신규 생성)
- .firebaserc
- firebase.json
```

**배포 순서:**
1. `firebase deploy --only firestore:indexes`
2. Firebase Console에서 인덱스 빌드 상태 확인 (수 분 소요)
3. 완료 후 쿼리 성능 테스트

**산출물:**
- `DATA_MIGRATION_REPORT.md`
- `firestore.indexes.json`

---

### **Phase 3: 에러 처리 및 안정성 강화 (2일)**
> 목표: 예외 상황 대응 능력 향상

#### Step 3.1: 에러 분류 체계 수립 (1시간)
```
파일:
- backend/src/utils/errors.js (신규)
- backend/src/middleware/error.middleware.js
```

**에러 코드 설계:**
```javascript
AUTH_TOKEN_EXPIRED: 401
AUTH_INVALID_TOKEN: 401
AUTH_UNAUTHORIZED: 403
DB_CONNECTION_ERROR: 503
DB_QUERY_FAILED: 500
SCRAPER_NETWORK_ERROR: 503
SCRAPER_PARSE_ERROR: 500
EMAIL_SEND_FAILED: 500
```

#### Step 3.2: Playwright 브라우저 누수 방지 (1시간)
```
Priority: HIGH
Risk: Low

파일:
- backend/src/services/scraper.service.js
```

**개선 사항:**
1. `try-finally` 블록으로 확실한 리소스 해제
2. 타임아웃 설정 (30초)
3. 브라우저 프로세스 모니터링

**테스트:**
- [ ] 정상 실행 시 브라우저 종료 확인
- [ ] 에러 발생 시 브라우저 종료 확인
- [ ] 타임아웃 시 브라우저 강제 종료 확인

#### Step 3.3: Retry 메커니즘 추가 (2시간)
```
파일:
- backend/src/utils/retry.js (신규)
- backend/src/services/scraper.service.js
- backend/src/services/notification.service.js
```

**Retry 전략:**
```javascript
스크래핑: 3회 재시도 (exponential backoff)
이메일 발송: 2회 재시도 (고정 5초 간격)
Firestore 쓰기: 3회 재시도 (exponential backoff)
```

#### Step 3.4: 로깅 통일 (1시간)
```
파일:
- backend/src/utils/logger.js (Winston으로 업그레이드)
- 모든 console.log를 logger로 변경
```

**로그 레벨 정의:**
```
ERROR: 에러 발생 (알람 필요)
WARN: 비정상 상황 (모니터링 필요)
INFO: 주요 이벤트 (스케줄러 실행 등)
DEBUG: 상세 디버깅 정보
```

**산출물:**
- `ERROR_HANDLING_GUIDE.md`
- `backend/src/utils/errors.js`

---

### **Phase 4: 성능 최적화 (3일)**
> 목표: 응답 속도 개선 및 리소스 효율화

#### Step 4.1: Firestore Batch Write 적용 (2시간)
```
Priority: MEDIUM
Risk: Low

파일:
- backend/src/services/firestore.service.js
- backend/src/services/scraper.service.js
```

**성능 목표:**
- 스크래핑 저장 시간: 10초 → 2초 (80% 개선)

**측정 방법:**
```javascript
console.time('saveAvailability');
await firestoreService.batchSaveAvailability(items);
console.timeEnd('saveAvailability');
```

#### Step 4.2: 프론트엔드 상태 관리 개선 (4시간)
```
Priority: MEDIUM
Risk: Medium

변경:
- React Query 설치 및 설정
- UserSettings 컴포넌트 리팩토링
- AvailableSites 컴포넌트 리팩토링
```

**구현 순서:**
1. `@tanstack/react-query` 설치
2. `QueryClientProvider` 설정
3. 한 컴포넌트씩 마이그레이션
4. 캐싱 전략 설정 (staleTime, cacheTime)

**측정 지표:**
- [ ] 불필요한 API 호출 감소 확인 (DevTools Network)
- [ ] 리렌더링 횟수 감소 확인 (React DevTools Profiler)

#### Step 4.3: API 응답 캐싱 (2시간)
```
파일:
- backend/src/middleware/cache.middleware.js (신규)
- backend/src/routes/availability.routes.js
```

**캐싱 전략:**
```
/api/availability: 5분 캐시
/api/settings: 캐시 안함 (실시간 필요)
/api/logs/scraping: 1분 캐시
```

#### Step 4.4: 쿼리 최적화 (2시간)
```
작업:
1. 불필요한 전체 스캔 제거
2. 페이지네이션 구현
3. 필드 선택 (Firestore select)
```

**측정:**
- [ ] 읽기 작업 횟수 감소 (Firebase Console)
- [ ] API 응답 시간 개선

**산출물:**
- `PERFORMANCE_REPORT.md` (Before/After 비교)

---

### **Phase 5: 코드 품질 개선 (3-4일)**
> 목표: 유지보수성 향상

#### Step 5.1: 설정 중앙화 (1시간)
```
Priority: LOW
Risk: Low

파일:
- backend/src/config/index.js (신규)
- 모든 하드코딩 값 이동
```

#### Step 5.2: TypeScript 또는 JSDoc 추가 (6시간)
```
옵션 A: JSDoc (빠른 적용)
- 주요 함수에 타입 주석 추가
- VSCode IntelliSense 개선

옵션 B: TypeScript (장기 전략)
- 점진적 마이그레이션
- .js → .ts 하나씩 변환
```

**권장: 옵션 A (JSDoc)부터 시작**

#### Step 5.3: 테스트 코드 작성 (8시간)
```
우선순위:
1. 인증 미들웨어 테스트
2. Scraper 파싱 로직 테스트
3. Notification 매칭 로직 테스트
4. API 엔드포인트 통합 테스트
```

**목표 커버리지:**
- Critical Path: 80% 이상
- 전체: 50% 이상

#### Step 5.4: 린팅 및 포매팅 통일 (1시간)
```
파일:
- .eslintrc.json
- .prettierrc
- package.json (scripts)
```

**산출물:**
- `CONTRIBUTION_GUIDE.md`
- `.eslintrc.json`

---

### **Phase 6: 모니터링 및 관찰성 (2일)**
> 목표: 운영 가시성 확보

#### Step 6.1: 구조화된 로깅 (3시간)
```
파일:
- backend/src/utils/logger.js (Winston 고도화)
- JSON 포맷으로 변경
```

**로그 출력 예시:**
```json
{
  "timestamp": "2025-10-12T10:30:00.000Z",
  "level": "info",
  "message": "Scraping started",
  "context": {
    "userId": "abc123",
    "settingId": "def456",
    "monthsToScrape": ["2025-10", "2025-11"]
  }
}
```

#### Step 6.2: 헬스체크 고도화 (2시간)
```
파일:
- backend/src/routes/health.routes.js (신규)
- backend/src/services/health.service.js (신규)
```

**체크 항목:**
- Firestore 연결 상태
- 스케줄러 동작 상태
- 마지막 스크래핑 성공 시간
- 이메일 서비스 상태

#### Step 6.3: 메트릭 수집 (4시간)
```
옵션:
- Prometheus + Grafana
- Firebase Performance Monitoring
- AWS CloudWatch
```

**수집 메트릭:**
- 스크래핑 성공률
- 알림 발송 수
- API 응답 시간
- 에러 발생 빈도

**산출물:**
- `MONITORING_GUIDE.md`
- Grafana 대시보드 JSON

---

### **Phase 7: 추가 기능 및 최적화 (선택)**
> 목표: 사용자 경험 개선

#### Step 7.1: Rate Limiting (1시간)
```
파일:
- backend/src/middleware/rate-limit.middleware.js
```

#### Step 7.2: 웹훅 알림 지원 (3시간)
```
기능:
- Slack, Discord, Telegram 알림 추가
```

#### Step 7.3: 관리자 대시보드 (8시간)
```
기능:
- 시스템 상태 모니터링
- 사용자 관리
- 스케줄러 수동 제어
```

---

## 📅 타임라인 및 리소스

### 전체 일정 (누적 18-23일)
```
Week 1:
├─ Day 1-2: Phase 0 (준비)
├─ Day 3: Phase 1 (긴급 보안 패치) ★ 최우선
├─ Day 4-6: Phase 2 (데이터 무결성)
└─ Day 7: Buffer

Week 2:
├─ Day 8-9: Phase 3 (에러 처리)
├─ Day 10-12: Phase 4 (성능 최적화)
└─ Day 13-14: Buffer

Week 3:
├─ Day 15-18: Phase 5 (코드 품질)
├─ Day 19-20: Phase 6 (모니터링)
└─ Day 21-23: Phase 7 (선택)
```

### 리소스 할당
```
1명 풀타임 개발자 기준:
- Phase 0-4: 필수 (2주)
- Phase 5-6: 권장 (1주)
- Phase 7: 선택 (협의)

2명 개발자 시:
- 개발자 A: Phase 1, 3, 5
- 개발자 B: Phase 2, 4, 6
- 병렬 진행 시 약 2주 완료 가능
```

---

## 🚨 롤백 전략

### 각 Phase별 롤백 계획
```
Phase 1 (보안):
- Git revert
- 환경변수 롤백
- 10분 내 복구 가능

Phase 2 (데이터):
- Firestore backup에서 복원
- 인덱스 삭제 (firebase deploy)
- 1시간 내 복구 가능

Phase 3-6:
- Git revert
- 의존성 롤백 (package.json)
- 30분 내 복구 가능
```

### 긴급 상황 대응
```
1. 즉시 알림 차단 (스케줄러 중지)
   - backend/src/app.js:47 주석 처리

2. 안정 버전으로 롤백
   - git checkout [stable-tag]
   - npm install
   - restart server

3. 사용자 공지
   - 이메일 발송
   - 대시보드 공지사항
```

---

## ✅ 완료 기준 (Definition of Done)

각 Phase 완료 시 체크:
- [ ] 코드 리뷰 완료
- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 개발 환경에서 1일 이상 안정 동작
- [ ] 문서 업데이트 완료
- [ ] 배포 노트 작성
- [ ] 팀 공유 및 승인

---

## 📈 진행 상황 추적

| Phase | 상태 | 시작일 | 완료일 | 담당자 | 비고 |
|-------|------|--------|--------|--------|------|
| Phase 0 | ⏳ Pending | - | - | - | - |
| Phase 1 | ⏳ Pending | - | - | - | - |
| Phase 2 | ⏳ Pending | - | - | - | - |
| Phase 3 | ⏳ Pending | - | - | - | - |
| Phase 4 | ⏳ Pending | - | - | - | - |
| Phase 5 | ⏳ Pending | - | - | - | - |
| Phase 6 | ⏳ Pending | - | - | - | - |
| Phase 7 | ⏳ Pending | - | - | - | - |

---

## 📚 참고 문서

- [CODE_REVIEW.md](./CODE_REVIEW.md) - 초기 코드 리뷰 결과
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) - 롤백 상세 계획 (Phase 0에서 생성)
- [TESTING_ENVIRONMENT.md](./TESTING_ENVIRONMENT.md) - 테스트 환경 설정 가이드
- [SECURITY_PATCH_v1.0.md](./SECURITY_PATCH_v1.0.md) - 보안 패치 노트 (Phase 1에서 생성)

---

## 📞 문의 및 지원

개선 작업 중 문제 발생 시:
1. 즉시 작업 중단
2. 현재 상태 문서화
3. 롤백 계획 검토
4. 팀 리더에게 보고

**마지막 업데이트**: 2025-10-12
**문서 버전**: 1.0
