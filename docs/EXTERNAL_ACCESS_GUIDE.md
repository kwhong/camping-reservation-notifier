# 외부 접속 가이드 (Cloudflare Tunnel)

## 🌐 현재 외부 접속 URL

### Frontend (사용자 접속)
```
https://origin-bags-halifax-semester.trycloudflare.com
```

### Backend API (내부 통신용)
```
https://sewing-washington-many-unnecessary.trycloudflare.com/api
```

**참고:** Quick Tunnel URL은 재시작할 때마다 변경됩니다.

---

## 📋 Firebase Authorized Domains 설정

외부에서 Firebase 로그인을 사용하려면 반드시 Firebase Console에서 도메인을 추가해야 합니다.

### 1단계: Firebase Console 접속

1. 브라우저에서 Firebase Console 열기:
   ```
   https://console.firebase.google.com/
   ```

2. `camping-scraper-prod` 프로젝트 선택

### 2단계: Authentication 설정

1. 왼쪽 메뉴에서 **Build** → **Authentication** 클릭
2. 상단 탭에서 **Settings** 클릭
3. 아래로 스크롤하여 **Authorized domains** 섹션 찾기

### 3단계: 도메인 추가

1. **Add domain** 버튼 클릭
2. 다음 도메인 입력 (https:// 없이):
   ```
   origin-bags-halifax-semester.trycloudflare.com
   ```
3. **Add** 버튼 클릭

### 확인

Authorized domains 목록에 다음이 포함되어야 합니다:
- ✅ `localhost`
- ✅ `camping-scraper-prod.firebaseapp.com`
- ✅ `camping-scraper-prod.web.app`
- ✅ `origin-bags-halifax-semester.trycloudflare.com` (새로 추가)

---

## 🚀 터널 실행 방법

### Backend 터널
```bash
cd C:\claude\scraping
./cloudflared.exe tunnel --url http://localhost:3000
```

### Frontend 터널
```bash
cd C:\claude\scraping
./cloudflared.exe tunnel --url http://localhost:5176
```

**포트 참고:**
- Frontend는 기본적으로 5173에서 시작하지만, 이미 사용 중이면 자동으로 다음 포트(5174, 5175, 5176...)를 사용합니다
- 터널 생성 시 Frontend가 실제 실행 중인 포트를 확인하세요

**중요:**
- 터널을 시작하면 **URL이 매번 변경**될 수 있습니다
- URL이 변경되면:
  1. Frontend `.env` 파일의 `VITE_API_URL` 업데이트
  2. Frontend 재시작
  3. Firebase Console에서 새 도메인 추가

---

## 🧪 외부 접속 테스트

### 1. Frontend 접속 테스트
```
https://origin-bags-halifax-semester.trycloudflare.com
```

**확인 사항:**
- ✅ 페이지가 정상적으로 로드됨
- ✅ 로그인 버튼이 보임
- ✅ UI가 정상적으로 렌더링됨

### 2. Firebase 로그인 테스트
1. Google 로그인 버튼 클릭
2. Google 계정으로 로그인
3. 로그인 성공 후 대시보드 표시 확인

### 3. Backend API 연동 테스트
로그인 후:
- ✅ 가용 사이트 데이터 조회
- ✅ 사용자 설정 생성/조회/수정/삭제
- ✅ 알림 목록 조회
- ✅ 스크래핑 이력 조회

### 4. 다른 기기에서 테스트
- 스마트폰에서 Frontend URL 접속
- 다른 PC에서 Frontend URL 접속
- 인터넷이 연결된 어디서든 접속 가능

---

## ⚠️ 주의사항

### Quick Tunnel의 제약사항

1. **URL 변경**
   - 터널을 재시작하면 URL이 변경됩니다
   - 고정 URL이 필요하면 Named Tunnel 사용 권장

2. **세션 시간**
   - Quick Tunnel은 일정 시간 사용 후 재연결이 필요할 수 있습니다

3. **성능**
   - Cloudflare의 무료 티어는 대역폭 제한이 있을 수 있습니다
   - 프로덕션 환경에는 VPS 배포 권장

### 보안 고려사항

1. **CORS 설정**
   - Backend는 이미 CORS가 모든 origin을 허용하도록 설정되어 있습니다
   - 필요시 `backend/src/app.js`에서 특정 도메인만 허용하도록 변경

2. **Firebase Security Rules**
   - Firestore 보안 규칙이 적절히 설정되어 있는지 확인
   - 인증된 사용자만 데이터 접근 가능하도록 설정

3. **환경변수 관리**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - 민감한 정보(API 키, 비밀번호)는 `.env`에만 보관

---

## 🔧 문제 해결

### 1. Firebase 로그인 오류
```
This domain is not authorized for OAuth operations for your Firebase project.
```

**해결방법:**
- Firebase Console에서 Authorized domains에 Frontend URL 추가
- 도메인은 `https://` 없이 입력

### 2. Backend API 연결 실패
```
Network Error or CORS Error
```

**해결방법:**
1. Frontend `.env` 파일의 Backend URL 확인
2. Backend 터널이 실행 중인지 확인
3. Frontend 재시작: `cd frontend && npm run dev`

### 3. 페이지가 로드되지 않음
- Frontend 터널이 실행 중인지 확인
- URL이 올바른지 확인
- 브라우저 캐시 삭제 후 재시도

### 4. 터널 URL이 변경됨
1. 새로운 Backend URL을 `frontend/.env`에 업데이트
2. Frontend 재시작
3. 새로운 Frontend URL을 Firebase Console에 추가

### 5. "This host is not allowed" 오류
```
Blocked request. This host ("xxx.trycloudflare.com") is not allowed.
```

**해결방법:**
1. `frontend/vite.config.js` 파일을 열기
2. `server` 섹션에 다음 추가:
   ```javascript
   server: {
     host: true,
     allowedHosts: [
       'localhost',
       '.trycloudflare.com',
     ],
     // ... 기타 설정
   }
   ```
3. Frontend 재시작

---

## 📱 모바일 접속

스마트폰 브라우저에서 동일한 Frontend URL로 접속 가능합니다:
```
https://origin-bags-halifax-semester.trycloudflare.com
```

**참고:**
- 모바일 브라우저에서도 Google 로그인 작동
- 반응형 디자인으로 모바일 최적화되어 있음

---

## 🌟 Named Tunnel로 업그레이드 (선택사항)

고정 URL을 원하시면 Named Tunnel을 설정할 수 있습니다.

### 장점:
- ✅ 고정 URL (재시작해도 동일)
- ✅ 커스텀 도메인 연결 가능
- ✅ Cloudflare 대시보드에서 관리

### 설정 방법:
1. Cloudflare 계정 생성 (무료)
2. `./cloudflared.exe tunnel login` (브라우저 인증)
3. Named Tunnel 생성
4. 설정 파일로 관리

자세한 내용은 별도 문의 주세요.

---

## 📞 지원

문제가 발생하면:
1. 이 가이드의 문제 해결 섹션 참고
2. 브라우저 콘솔 (F12) 에러 메시지 확인
3. Backend/Frontend 터미널 로그 확인

---

## 📝 체크리스트

외부 접속 설정 완료 체크리스트:

- [ ] Cloudflare Tunnel 설치 완료
- [ ] Backend 터널 실행 중
- [ ] Frontend 터널 실행 중
- [ ] Frontend `.env` 파일에 Backend URL 업데이트
- [ ] Frontend 재시작 완료
- [ ] Firebase Console에 Frontend URL 추가
- [ ] 외부에서 Frontend URL 접속 테스트
- [ ] Firebase 로그인 테스트
- [ ] API 연동 테스트 (데이터 조회)
- [ ] 다른 기기에서 접속 테스트

---

**생성일:** 2025-10-11
**버전:** 1.0
**Cloudflare Tunnel Version:** 2025.9.1
