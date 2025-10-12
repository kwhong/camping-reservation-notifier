# Security Patch v1.0

발행일: 2025-10-12
심각도: CRITICAL

## 📋 개요

이 보안 패치는 시스템에서 발견된 치명적인 보안 취약점을 해결합니다.

---

## 🔴 패치된 취약점

### 1. 민감정보 노출 (CVE-2025-CAMP-001)

**문제:**
- `backend/src/config/email.js` 파일에 Gmail App Password가 주석으로 하드코딩됨
- `backend/.env.example` 파일에 실제 비밀번호 노출

**영향:**
- 코드 저장소 접근 권한이 있는 누구나 이메일 계정 도용 가능
- 무단 이메일 발송 가능성
- 사용자 정보 유출 위험

**해결:**
- 민감정보 주석 제거
- `.env.example` 파일의 샘플 값으로 교체
- 환경변수만 사용하도록 강제

**영향받는 파일:**
- `backend/src/config/email.js:13`
- `backend/.env.example:7`

**조치 필요 사항:**
- [ ] Git 히스토리 확인 (`.env` 파일 커밋 여부)
- [ ] 필요시 Gmail App Password 재발급
- [ ] 팀원들에게 새 비밀번호 공유

---

### 2. 인증 우회 취약점 (CVE-2025-CAMP-002)

**문제:**
- 사용자가 다른 사용자의 설정을 수정/삭제할 수 있음
- Authorization 검증 부재
- Firestore 문서 ID만으로 리소스 접근 가능

**공격 시나리오:**
```javascript
// 악의적 사용자가 다른 사용자의 설정 ID를 추측하여 삭제
DELETE /api/settings/abc123
Authorization: Bearer <악의적_사용자_토큰>

// 응답: 200 OK (삭제 성공!)
```

**영향:**
- 다른 사용자의 알림 설정 무단 수정/삭제
- 서비스 거부 공격 (DoS)
- 개인정보 보호 위반

**해결:**
- `firestoreService.getUserSetting()` 메서드 추가
- PUT /api/settings/:id 엔드포인트에 소유권 검증 추가
- DELETE /api/settings/:id 엔드포인트에 소유권 검증 추가
- 403 Forbidden 에러 반환

**영향받는 파일:**
- `backend/src/services/firestore.service.js` (54-67행 추가)
- `backend/src/routes/settings.routes.js:51-85` (UPDATE)
- `backend/src/routes/settings.routes.js:88-113` (DELETE)

**검증 방법:**
```bash
# 1. 사용자 A로 설정 생성
curl -X POST http://localhost:3000/api/settings \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campingName":"테스트","region":"테스트","dateFrom":"2025-11-01","dateTo":"2025-11-05"}'

# 2. 설정 ID 복사: abc123

# 3. 사용자 B가 사용자 A의 설정 수정 시도
curl -X PUT http://localhost:3000/api/settings/abc123 \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}'

# 예상 응답: 403 Forbidden
# {"error":"Unauthorized: You can only update your own settings"}
```

---

### 3. CORS 정책 부재 (CVE-2025-CAMP-003)

**문제:**
- 모든 origin에서 API 접근 허용
- CORS 공격에 취약
- CSRF 토큰 없음

**영향:**
- 악의적인 웹사이트에서 사용자 브라우저를 통해 API 호출 가능
- 사용자 모르게 설정 변경 가능
- 세션 하이재킹 위험

**해결:**
- 허용된 origin만 접근 가능하도록 CORS 설정 강화
- credentials 옵션 활성화
- Cloudflare Tunnel 도메인 화이트리스트 추가

**영향받는 파일:**
- `backend/src/app.js:19-50`
- `backend/.env.example:10-11` (FRONTEND_URL 추가)

**설정 내용:**
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Cloudflare Tunnel 허용
    if (origin.includes('trycloudflare.com')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

---

## 📊 변경 사항 요약

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `backend/src/config/email.js` | 수정 | 주석에서 민감정보 제거 |
| `backend/.env.example` | 수정 | 샘플 비밀번호로 교체, FRONTEND_URL 추가 |
| `backend/src/services/firestore.service.js` | 추가 | getUserSetting() 메서드 추가 |
| `backend/src/routes/settings.routes.js` | 수정 | Authorization 검증 로직 추가 |
| `backend/src/app.js` | 수정 | CORS 정책 강화 |

---

## 🚀 배포 절차

### 1. 준비 사항

```bash
# 1. 현재 브랜치 확인
git status

# 2. 변경사항 확인
git diff

# 3. 백업 생성 (선택)
node backend/scripts/backup-firestore.js
```

### 2. 코드 배포

```bash
# 1. 변경사항 커밋
git add backend/src/config/email.js
git add backend/.env.example
git add backend/src/services/firestore.service.js
git add backend/src/routes/settings.routes.js
git add backend/src/app.js
git add docs/SECURITY_PATCH_v1.0.md

git commit -m "security: Fix critical security vulnerabilities

- Remove hardcoded credentials from comments
- Add authorization checks for settings endpoints
- Strengthen CORS policy

BREAKING CHANGE: Requires FRONTEND_URL environment variable"

# 2. 태그 생성
git tag -a security-patch-v1.0 -m "Security Patch v1.0"

# 3. 푸시
git push origin main
git push origin security-patch-v1.0
```

### 3. 환경변수 업데이트

**프로덕션 서버에서:**

```bash
# backend/.env 파일 편집
nano backend/.env

# 다음 추가/수정:
FRONTEND_URL=https://your-production-domain.com

# 또는 Cloudflare Tunnel 사용 시:
FRONTEND_URL=https://your-tunnel.trycloudflare.com
```

### 4. 서버 재시작

```bash
# Backend 재시작
cd backend
npm install  # 새 의존성 없음, 확인용
pm2 restart camping-scraper-backend

# 또는
npm start
```

### 5. 검증

```bash
# 1. 헬스체크
curl http://localhost:3000/health

# 2. CORS 테스트
curl -H "Origin: https://malicious-site.com" \
  -X GET http://localhost:3000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v

# 예상: CORS 에러 또는 거부

# 3. Authorization 테스트 (위 "검증 방법" 참고)
```

---

## 🔄 롤백 절차

문제 발생 시:

```bash
# 1. 이전 태그로 롤백
git checkout [PREVIOUS_TAG]

# 2. 서버 재시작
pm2 restart camping-scraper-backend

# 3. 확인
curl http://localhost:3000/health
```

또는:

```bash
# 특정 커밋으로 되돌리기
git revert [COMMIT_HASH]
git push origin main
pm2 restart camping-scraper-backend
```

---

## ⚠️ 주의사항

1. **환경변수 필수**: `FRONTEND_URL`이 설정되지 않으면 기본값(localhost:5173) 사용
2. **Cloudflare Tunnel**: 동적 도메인 사용 시 매번 허용됨 (보안 약화)
3. **기존 세션**: 이미 로그인한 사용자는 영향 없음
4. **API 클라이언트**: 서드파티 클라이언트는 CORS 정책으로 차단될 수 있음

---

## 📈 모니터링

패치 후 다음 지표 모니터링:

1. **401/403 에러 증가**: 정상 (무단 접근 차단)
2. **500 에러 증가**: 비정상 (롤백 필요)
3. **사용자 불만**: CORS 설정 확인
4. **이메일 발송 실패**: 비밀번호 확인

**로그 확인:**
```bash
# 인증 실패 로그
grep "Unauthorized" backend/logs/app.log | tail -20

# CORS 에러 로그
grep "Not allowed by CORS" backend/logs/app.log | tail -20
```

---

## 📞 문의

보안 문제 발견 시:
- 이메일: security@your-domain.com
- 긴급: [연락처]

---

## 📚 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**마지막 업데이트**: 2025-10-12
**패치 버전**: 1.0
**다음 리뷰**: 2025-11-12
