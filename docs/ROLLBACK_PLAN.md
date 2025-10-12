# 롤백 계획 (Rollback Plan)

생성일: 2025-10-12
버전: 1.0

## 📋 개요

이 문서는 시스템 개선 작업 중 문제 발생 시 안전하게 이전 상태로 복구하기 위한 롤백 절차를 정의합니다.

---

## 🎯 롤백 원칙

1. **데이터 우선**: 사용자 데이터 보호가 최우선
2. **빠른 복구**: 서비스 중단 시간 최소화 (목표: 30분 이내)
3. **완전한 복구**: 부분 롤백보다 전체 롤백 선호
4. **문서화**: 모든 롤백 과정 기록

---

## 🔄 Phase별 롤백 절차

### Phase 0: 준비 단계

**롤백 트리거:**
- 백업 실패
- 테스트 환경 구축 실패

**롤백 절차:**
1. 작업 중단
2. 생성된 파일 삭제
3. 다음 Phase 진행 보류

**복구 시간:** 즉시

---

### Phase 1: 긴급 보안 패치

#### Step 1.1: 민감정보 제거
**롤백 트리거:**
- 코드 변경 후 빌드 실패
- 서버 시작 실패

**롤백 절차:**
```bash
# 1. Git으로 되돌리기
git checkout backend/src/config/email.js

# 2. 서버 재시작
cd backend
npm start
```

**복구 시간:** 5분

#### Step 1.2: Authorization 검증 추가
**롤백 트리거:**
- API 응답 500 에러 증가
- 사용자가 자신의 설정 접근 불가
- 테스트 실패

**롤백 절차:**
```bash
# 1. 변경사항 확인
git diff backend/src/routes/settings.routes.js
git diff backend/src/services/firestore.service.js

# 2. Git으로 되돌리기
git checkout backend/src/routes/settings.routes.js
git checkout backend/src/services/firestore.service.js

# 3. 서버 재시작
pm2 restart camping-scraper-backend
# 또는
npm start

# 4. API 테스트
curl -X GET http://localhost:3000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**복구 시간:** 10분

**검증:**
- [ ] GET /api/settings 정상 동작
- [ ] PUT /api/settings/:id 정상 동작
- [ ] DELETE /api/settings/:id 정상 동작

#### Step 1.3: CORS 설정 강화
**롤백 트리거:**
- 프론트엔드에서 API 호출 CORS 에러
- OPTIONS 요청 실패

**롤백 절차:**
```bash
# 1. app.js 되돌리기
git checkout backend/src/app.js

# 2. 환경변수 원복 (.env 백업에서)
cp backend/.env.backup backend/.env

# 3. 서버 재시작
npm start
```

**복구 시간:** 5분

**검증:**
- [ ] 프론트엔드 로그인 성공
- [ ] 브라우저 Console에 CORS 에러 없음

---

### Phase 2: 데이터 무결성 개선

#### Step 2.1-2.2: Upsert 로직 구현
**롤백 트리거:**
- 스크래핑 실패 (에러 로그 증가)
- 데이터 저장 안됨
- 중복이 더 심해짐

**롤백 절차:**
```bash
# 1. 코드 롤백
git checkout backend/src/services/firestore.service.js
git checkout backend/src/services/scraper.service.js

# 2. npm 패키지 재설치 (변경된 경우)
cd backend
npm install

# 3. 서버 재시작
npm start

# 4. 스케줄러 정상 동작 확인
tail -f logs/app.log | grep "Scraping"
```

**복구 시간:** 15분

**검증:**
- [ ] 스케줄러 정상 실행
- [ ] Firestore에 데이터 저장 확인
- [ ] 에러 로그 없음

#### Step 2.3: 중복 데이터 정리
**롤백 트리거:**
- 정리 스크립트 실행 중 에러
- 필요한 데이터까지 삭제됨
- 알림 미발송

**롤백 절차:**
```bash
# 1. 스크립트 즉시 중단
Ctrl + C

# 2. Firestore 백업에서 복원
node scripts/restore-firestore.js --backup-id=BACKUP_TIMESTAMP

# 3. 복원 확인
node scripts/verify-data.js
```

**복구 시간:** 30분 ~ 1시간 (데이터 양에 따라)

**중요:** 이 단계는 반드시 dry-run 먼저 실행!

#### Step 2.4: Firestore 인덱스 생성
**롤백 트리거:**
- 인덱스 생성 실패
- 쿼리 오히려 느려짐
- 인덱스 빌드 시간 초과

**롤백 절차:**
```bash
# 1. Firebase Console에서 인덱스 수동 삭제
# https://console.firebase.google.com/project/camping-scraper-prod/firestore/indexes

# 2. 로컬 설정 파일 제거
git checkout firestore.indexes.json
# 또는
rm firestore.indexes.json

# 3. 기존 쿼리로 복원
git checkout backend/src/services/firestore.service.js
```

**복구 시간:** 10분

---

### Phase 3: 에러 처리 및 안정성 강화

#### Step 3.1: 에러 분류 체계
**롤백 트리거:**
- 새 에러 처리로 인한 500 에러 증가
- 에러 응답 포맷 변경으로 프론트엔드 에러

**롤백 절차:**
```bash
# 1. 코드 롤백
git checkout backend/src/utils/errors.js
git checkout backend/src/middleware/error.middleware.js

# 2. 서버 재시작
npm start
```

**복구 시간:** 10분

#### Step 3.2: Playwright 브라우저 누수 방지
**롤백 트리거:**
- 스크래핑 실패
- 브라우저 프로세스 증가
- 메모리 사용량 급증

**롤백 절차:**
```bash
# 1. 모든 브라우저 프로세스 강제 종료
pkill -f chromium
# Windows에서:
taskkill /F /IM chrome.exe /T

# 2. 코드 롤백
git checkout backend/src/services/scraper.service.js

# 3. 서버 재시작
npm start

# 4. 프로세스 모니터링
ps aux | grep chromium
```

**복구 시간:** 15분

#### Step 3.3-3.4: Retry 메커니즘 및 로깅
**롤백 트리거:**
- 무한 재시도 루프
- 로그 파일 급증 (디스크 공간 부족)
- 성능 저하

**롤백 절차:**
```bash
# 1. 서버 즉시 중지
pm2 stop camping-scraper-backend

# 2. 코드 롤백
git checkout backend/src/utils/retry.js
git checkout backend/src/utils/logger.js
git checkout backend/src/services/

# 3. npm 패키지 재설치
npm install

# 4. 서버 재시작
npm start
```

**복구 시간:** 20분

---

### Phase 4: 성능 최적화

#### Step 4.1: Batch Write
**롤백 트리거:**
- 배치 저장 실패
- 일부 데이터만 저장됨
- 트랜잭션 충돌

**롤백 절차:**
```bash
# 1. 코드 롤백
git checkout backend/src/services/firestore.service.js
git checkout backend/src/services/scraper.service.js

# 2. 서버 재시작
npm start

# 3. 마지막 스크래핑 재실행
node scripts/manual-scraping.js
```

**복구 시간:** 15분

#### Step 4.2: React Query 도입
**롤백 트리거:**
- 프론트엔드 빌드 실패
- 페이지 로딩 안됨
- 상태 동기화 문제

**롤백 절차:**
```bash
# 1. Git 롤백
cd frontend
git checkout src/

# 2. package.json 롤백
git checkout package.json package-lock.json

# 3. 의존성 재설치
npm install

# 4. 빌드 테스트
npm run build

# 5. 개발 서버 재시작
npm run dev
```

**복구 시간:** 20분

#### Step 4.3-4.4: API 캐싱 및 쿼리 최적화
**롤백 트리거:**
- 캐시 만료 안됨 (stale data)
- 페이지네이션 버그
- API 응답 에러

**롤백 절차:**
```bash
# 1. 코드 롤백
git checkout backend/src/middleware/cache.middleware.js
git checkout backend/src/routes/
git checkout backend/src/services/firestore.service.js

# 2. 서버 재시작 (캐시 초기화)
pm2 restart camping-scraper-backend

# 3. Redis 캐시 삭제 (사용하는 경우)
redis-cli FLUSHALL
```

**복구 시간:** 15분

---

### Phase 5-6: 코드 품질 및 모니터링

**롤백 트리거:**
- 빌드 실패
- 테스트 통과 안됨
- 모니터링 시스템 오버헤드

**롤백 절차:**
```bash
# 1. 전체 롤백
git log --oneline -10  # 최근 커밋 확인
git revert [COMMIT_HASH]  # 문제 커밋 되돌리기

# 2. 의존성 재설치
cd backend && npm install
cd ../frontend && npm install

# 3. 빌드 확인
npm run build

# 4. 서비스 재시작
pm2 restart all
```

**복구 시간:** 30분

---

## 🚨 긴급 롤백 (Emergency Rollback)

### 전체 시스템 롤백

**상황:**
- 서비스 완전 중단
- 데이터 손실 위험
- 복구 방법 불명확

**절차:**

```bash
# 1. 즉시 서비스 중지
pm2 stop all

# 2. 안정 버전으로 롤백
git tag  # 안정 태그 확인
git checkout [STABLE_TAG]  # 예: v1.0.0-stable

# 3. 환경변수 복원
cp .env.backup .env

# 4. 의존성 재설치
cd backend && npm ci
cd ../frontend && npm ci

# 5. Firestore 데이터 복원 (필요시)
node scripts/restore-firestore.js --backup-id=LATEST

# 6. 서비스 재시작
cd backend && npm start &
cd frontend && npm run dev &

# 7. 헬스체크
curl http://localhost:3000/health
```

**복구 시간:** 1시간

---

## 📊 롤백 체크리스트

롤백 실행 전:
- [ ] 현재 상태 스냅샷 생성 (git commit)
- [ ] 에러 로그 캡처 및 저장
- [ ] 사용자 영향 범위 파악
- [ ] 롤백 절차 숙지

롤백 실행 중:
- [ ] 각 단계 완료 후 검증
- [ ] 진행 상황 문서화
- [ ] 팀원에게 상황 공유

롤백 완료 후:
- [ ] 서비스 정상 동작 확인
- [ ] 사용자 공지 (필요시)
- [ ] 근본 원인 분석 (Post-Mortem)
- [ ] 재발 방지 대책 수립

---

## 📞 에스컬레이션

롤백 실패 시:
1. **즉시 알림**: 팀 리더, DevOps 팀
2. **대체 방안**: 클라우드 백업에서 전체 복원
3. **사용자 공지**: 서비스 중단 안내 이메일/공지

**비상 연락처:**
- 시스템 관리자: [연락처]
- Firebase 지원: https://firebase.google.com/support
- Cloudflare 지원: https://www.cloudflare.com/support

---

## 📝 롤백 이력

| 날짜 | Phase | 사유 | 소요 시간 | 담당자 | 비고 |
|------|-------|------|-----------|--------|------|
| - | - | - | - | - | - |

---

## 🔗 관련 문서

- [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) - 전체 개선 계획
- [TESTING_ENVIRONMENT.md](./TESTING_ENVIRONMENT.md) - 테스트 환경 가이드
- [OPERATOR_MANUAL.md](./OPERATOR_MANUAL.md) - 운영 매뉴얼

**마지막 업데이트**: 2025-10-12
**문서 버전**: 1.0
