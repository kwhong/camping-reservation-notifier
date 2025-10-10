# 캠핑장 예약 알림 시스템 - 빠른 배포 가이드

## 📋 목차

1. [5분 빠른 시작](#5분-빠른-시작)
2. [상세 배포 단계](#상세-배포-단계)
3. [배포 체크리스트](#배포-체크리스트)
4. [배포 후 확인](#배포-후-확인)
5. [문제 해결](#문제-해결)

---

## 5분 빠른 시작

### 필수 준비물
- [ ] Ubuntu 20.04+ 서버 (2GB RAM, 2 Core)
- [ ] 도메인 또는 고정 IP
- [ ] Firebase 프로젝트 (무료)
- [ ] Gmail 계정

### 원클릭 설치 스크립트

```bash
# 1. 스크립트 다운로드 및 실행
curl -fsSL https://raw.githubusercontent.com/kwhong/camping-reservation-notifier/main/deploy.sh | bash

# 2. 환경 변수 설정 (프롬프트에 따라 입력)
# - Gmail 주소
# - Gmail App Password
# - 도메인 이름

# 3. Firebase 설정 파일 업로드
# SCP로 camping-scraper-prod-firebase-설정.json 업로드

# 4. 완료!
```

**⚠️ 주의**: 원클릭 스크립트가 없는 경우, 아래 상세 배포 단계를 따르세요.

---

## 상세 배포 단계

### Step 1: 서버 준비 (10분)

#### 1.1 서버 접속
```bash
ssh username@your-server-ip
```

#### 1.2 시스템 업데이트
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### 1.3 Node.js 설치
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version   # v20.x.x
npm --version    # 10.x.x
```

#### 1.4 필수 도구 설치
```bash
# Git 설치
sudo apt-get install -y git

# PM2 설치 (전역)
sudo npm install -g pm2

# Nginx 설치
sudo apt-get install -y nginx
```

#### 1.5 Playwright 의존성 설치
```bash
sudo apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2
```

### Step 2: 코드 배포 (5분)

#### 2.1 저장소 클론
```bash
cd /var/www
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

git clone https://github.com/kwhong/camping-reservation-notifier.git
cd camping-reservation-notifier
```

#### 2.2 Backend 패키지 설치
```bash
cd backend
npm install

# Playwright 브라우저 설치
npx playwright install chromium
```

#### 2.3 Frontend 패키지 설치
```bash
cd ../frontend
npm install
```

### Step 3: Firebase 설정 (10분)

#### 3.1 Firebase 프로젝트 생성
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `camping-scraper-prod` (또는 원하는 이름)
4. Google Analytics 비활성화 (선택사항)
5. "프로젝트 만들기" 클릭

#### 3.2 Firestore 데이터베이스 생성
1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치: **asia-northeast3 (Seoul)** 선택
4. "프로덕션 모드로 시작" 선택
5. "사용 설정" 클릭

#### 3.3 Firestore Security Rules 설정
Firebase Console → Firestore → 규칙 탭에서 다음 규칙 복사/붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /userSettings/{settingId} {
      allow read, write: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
    }

    match /availability/{availId} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /notifications/{notifId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow write: if false;
    }

    match /scrapingLogs/{logId} {
      allow read: if isSignedIn();
      allow write: if false;
    }
  }
}
```

"게시" 버튼 클릭

#### 3.4 Firebase Authentication 설정
1. Firebase Console → Authentication
2. "시작하기" 클릭
3. "이메일/비밀번호" 활성화
4. "Google" 활성화
5. "저장" 클릭

#### 3.5 서비스 계정 키 다운로드
1. Firebase Console → 프로젝트 설정 (톱니바퀴 아이콘)
2. "서비스 계정" 탭
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드

#### 3.6 서비스 계정 키 서버에 업로드
로컬 PC에서:
```bash
# SCP로 업로드
scp camping-scraper-prod-firebase-*.json username@your-server-ip:/var/www/camping-reservation-notifier/

# 또는 내용을 복사하여 직접 생성
```

서버에서:
```bash
cd /var/www/camping-reservation-notifier
chmod 600 camping-scraper-prod-firebase-*.json
```

#### 3.7 Frontend Firebase 설정
1. Firebase Console → 프로젝트 설정 → 일반 탭
2. "내 앱" → 웹 앱 추가 (</> 아이콘)
3. 앱 이름 입력
4. Firebase SDK 설정 정보 복사

서버에서:
```bash
nano frontend/src/services/firebase.js
```

복사한 설정 정보로 업데이트:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Step 4: 환경 변수 설정 (5분)

#### 4.1 Gmail App Password 생성
1. Google 계정 (https://myaccount.google.com/) 접속
2. 보안 → 2단계 인증 활성화 (필수)
3. 보안 → 앱 비밀번호
4. "앱 선택" → 메일
5. "기기 선택" → 기타 (사용자 설정 이름)
6. "생성" 클릭
7. 16자리 비밀번호 복사 (공백 제거)

#### 4.2 Backend .env 생성
```bash
cd /var/www/camping-reservation-notifier/backend
nano .env
```

내용 입력:
```env
PORT=3000
NODE_ENV=production
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

저장: Ctrl+O → Enter → Ctrl+X

#### 4.3 Frontend .env 생성
```bash
cd /var/www/camping-reservation-notifier/frontend
nano .env
```

내용 입력:
```env
VITE_API_URL=http://your-domain.com/api
```

또는 IP 사용시:
```env
VITE_API_URL=http://123.456.789.0/api
```

저장: Ctrl+O → Enter → Ctrl+X

### Step 5: Frontend 빌드 (3분)

```bash
cd /var/www/camping-reservation-notifier/frontend
npm run build

# 빌드 확인
ls -la dist/
# index.html, assets/ 폴더가 있어야 함
```

### Step 6: Backend 실행 (2분)

```bash
cd /var/www/camping-reservation-notifier/backend

# PM2로 실행
pm2 start src/app.js --name camping-backend

# 자동 시작 설정
pm2 startup
# 표시되는 명령어 복사하여 실행 (sudo로 시작)

pm2 save

# 상태 확인
pm2 status
pm2 logs camping-backend --lines 20
```

**성공 로그 예시**:
```
🚀 서버가 포트 3000에서 실행 중입니다.
⏰ 스크래핑 스케줄러가 시작되었습니다.
```

### Step 7: Nginx 설정 (5분)

#### 7.1 Nginx 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/camping-notifier
```

내용 입력 (도메인 또는 IP로 변경):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    # 또는 IP 사용시
    # server_name 123.456.789.0;

    root /var/www/camping-reservation-notifier/frontend/dist;
    index index.html;

    # Frontend 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

저장: Ctrl+O → Enter → Ctrl+X

#### 7.2 Nginx 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/camping-notifier /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

#### 7.3 방화벽 설정
```bash
# HTTP/HTTPS 허용
sudo ufw allow 'Nginx Full'

# SSH 허용 (필수!)
sudo ufw allow ssh

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status
```

### Step 8: SSL 인증서 설치 (5분, 선택사항)

**도메인이 있는 경우에만 진행**

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 이메일 입력 (Let's Encrypt 알림용)
# 약관 동의: Y
# 이메일 공유: N (선택)
# 리다이렉트 설정: 2 (HTTPS로 리다이렉트)

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## 배포 체크리스트

### 배포 전 체크리스트

- [ ] 서버 준비 완료 (Ubuntu 20.04+, 2GB RAM)
- [ ] 도메인 또는 고정 IP 확보
- [ ] Firebase 프로젝트 생성
- [ ] Gmail 계정 및 App Password 준비
- [ ] SSH 접근 가능

### 배포 중 체크리스트

- [ ] Node.js 20.x 설치 완료
- [ ] Git, PM2, Nginx 설치 완료
- [ ] 저장소 클론 완료
- [ ] npm install 완료 (backend, frontend)
- [ ] Firebase 서비스 계정 키 업로드
- [ ] .env 파일 생성 (backend, frontend)
- [ ] Frontend 빌드 완료
- [ ] PM2로 Backend 실행
- [ ] Nginx 설정 완료
- [ ] 방화벽 설정 완료
- [ ] SSL 인증서 설치 (선택)

### 배포 후 체크리스트

- [ ] Backend 헬스 체크 성공
- [ ] Frontend 접속 확인
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 알림 설정 추가 테스트
- [ ] PM2 자동 시작 설정
- [ ] 스크래핑 로그 확인

---

## 배포 후 확인

### 1. Backend 헬스 체크

```bash
# 서버 내부에서
curl http://localhost:3000/health

# 외부에서 (도메인 사용시)
curl http://your-domain.com/api/health

# 응답 예시
# {"status":"ok","timestamp":"2025-10-10T12:00:00.000Z"}
```

### 2. PM2 상태 확인

```bash
pm2 status

# 예상 출력
# ┌─────┬──────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name             │ mode    │ status  │ cpu      │
# ├─────┼──────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ camping-backend  │ fork    │ online  │ 0%       │
# └─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### 3. Backend 로그 확인

```bash
pm2 logs camping-backend --lines 50

# 성공 메시지 확인
# 🚀 서버가 포트 3000에서 실행 중입니다.
# ⏰ 스크래핑 스케줄러가 시작되었습니다.
```

### 4. Frontend 접속 테스트

브라우저에서 접속:
```
http://your-domain.com
또는
http://your-server-ip
```

**확인 사항**:
- [ ] 로그인 페이지 표시
- [ ] "Google로 로그인" 버튼 표시
- [ ] 회원가입 폼 표시

### 5. 회원가입 및 로그인 테스트

1. "회원가입" 클릭
2. 이메일/비밀번호 입력
3. 회원가입 완료 확인
4. 로그인 테스트
5. 대시보드 표시 확인

### 6. 알림 설정 테스트

1. 대시보드 → "알림 설정" 클릭
2. "새 알림 설정 추가" 클릭
3. 정보 입력:
   - 캠핑장: 다리안계곡캠핑장
   - 지역: 경기도
   - 구역: 데크A 선택
   - 날짜: 내일 ~ 모레
   - 활성화: 체크
4. "저장" 클릭
5. 설정 목록에 표시 확인

### 7. 스크래핑 동작 확인

```bash
# 로그 실시간 확인
pm2 logs camping-backend

# 1분 대기 후 스크래핑 실행 확인
# ⏰ 스케줄러 실행 시작...
# 🌐 스크래핑 시작: 다리안계곡캠핑장
# ✅ 스크래핑 완료
```

Firebase Console에서 확인:
1. Firestore → scrapingLogs 컬렉션
2. 최신 로그 확인
3. status: "success" 확인

### 8. 이메일 알림 테스트

**테스트 방법**:
1. 실제로 예약 가능한 날짜/구역 설정
2. 1분 대기
3. 이메일 수신 확인

**빠른 테스트** (Backend에서 직접 실행):
```bash
cd /var/www/camping-reservation-notifier/backend
node -e "
import('./src/services/notification.service.js').then(m => {
  m.sendEmailNotification(
    'test@example.com',
    '다리안계곡캠핑장',
    '데크A',
    '2025-11-01'
  );
});
"
```

---

## 문제 해결

### 문제 1: Backend가 시작되지 않음

**증상**:
```bash
pm2 status
# status: errored
```

**해결**:
```bash
# 로그 확인
pm2 logs camping-backend --err --lines 50

# 일반적인 원인:
# 1. 포트 충돌
sudo lsof -i :3000
sudo kill -9 <PID>

# 2. .env 파일 누락
cat backend/.env
# PORT, EMAIL_USER 등 확인

# 3. Firebase 서비스 계정 파일 누락
ls -la camping-scraper-prod-firebase-*.json

# 4. 패키지 재설치
cd backend
rm -rf node_modules package-lock.json
npm install

# 5. 재시작
pm2 restart camping-backend
```

### 문제 2: Frontend 접속 안 됨

**증상**: 브라우저에서 사이트 접속 불가

**해결**:
```bash
# 1. Nginx 상태 확인
sudo systemctl status nginx

# 2. Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# 3. 설정 테스트
sudo nginx -t

# 4. Nginx 재시작
sudo systemctl restart nginx

# 5. 방화벽 확인
sudo ufw status
sudo ufw allow 'Nginx Full'

# 6. Frontend 빌드 확인
ls -la /var/www/camping-reservation-notifier/frontend/dist/
# index.html이 있어야 함
```

### 문제 3: API 호출 실패 (401 Unauthorized)

**증상**: 로그인 후 데이터 로드 안 됨

**해결**:
1. 브라우저 개발자 도구 → Console 확인
2. Network 탭에서 API 응답 확인

```bash
# Backend 로그 확인
pm2 logs camping-backend

# Firebase 설정 확인
# frontend/src/services/firebase.js
# - apiKey, authDomain 등이 올바른지 확인

# Firebase Console 확인
# - Authentication 활성화 확인
# - 승인된 도메인에 본인 도메인 추가
```

### 문제 4: 스크래핑이 실행되지 않음

**증상**: scrapingLogs에 로그 없음

**해결**:
```bash
# 로그 확인
pm2 logs camping-backend | grep "스크래핑"

# Sleep 시간 확인 (01:00-08:00 KST는 실행 안 됨)
date  # 현재 시간 확인

# 활성 설정 확인
# Firebase Console → userSettings
# - isActive: true인 설정이 있는지 확인
# - dateFrom, dateTo가 미래 날짜인지 확인

# Playwright 재설치
cd backend
npx playwright install chromium
npx playwright install-deps

# Backend 재시작
pm2 restart camping-backend
```

### 문제 5: 이메일 알림이 전송되지 않음

**증상**: notifications 로그는 있지만 이메일 안 옴

**해결**:
```bash
# 1. Gmail 설정 확인
cat backend/.env | grep EMAIL

# 2. Gmail App Password 재생성
# Google 계정 → 보안 → 앱 비밀번호

# 3. 스팸 메일함 확인

# 4. Backend 로그 확인
pm2 logs camping-backend | grep "이메일"

# 5. Gmail 전송 제한 확인
# 일일 500통 제한

# 6. 테스트 이메일 전송
cd backend
node -e "
import('./src/config/email.js').then(m => {
  m.default.sendMail({
    from: process.env.EMAIL_USER,
    to: 'test@example.com',
    subject: 'Test',
    text: 'Test email'
  });
});
"
```

### 문제 6: SSL 인증서 오류

**증상**: HTTPS 접속시 보안 경고

**해결**:
```bash
# 인증서 상태 확인
sudo certbot certificates

# 인증서 갱신
sudo certbot renew

# Nginx 재시작
sudo systemctl restart nginx

# 방화벽 HTTPS 포트 확인
sudo ufw status
sudo ufw allow 443/tcp
```

---

## 추가 리소스

### 유용한 명령어 모음

```bash
# === 시스템 상태 ===
pm2 status                          # PM2 프로세스 상태
pm2 monit                          # 리소스 모니터링
htop                               # 시스템 리소스
df -h                              # 디스크 사용량
free -h                            # 메모리 사용량

# === 로그 ===
pm2 logs camping-backend           # 실시간 로그
pm2 logs camping-backend --lines 100  # 최근 100줄
sudo tail -f /var/log/nginx/access.log  # Nginx 접근 로그
sudo tail -f /var/log/nginx/error.log   # Nginx 에러 로그

# === Backend 관리 ===
pm2 restart camping-backend        # 재시작
pm2 stop camping-backend           # 정지
pm2 start camping-backend          # 시작
pm2 delete camping-backend         # 삭제

# === Nginx ===
sudo nginx -t                      # 설정 테스트
sudo systemctl restart nginx       # 재시작
sudo systemctl reload nginx        # 리로드 (무중단)
sudo systemctl status nginx        # 상태 확인

# === 업데이트 ===
cd /var/www/camping-reservation-notifier
git pull origin main               # 최신 코드
cd backend && npm install          # Backend 패키지
cd ../frontend && npm install && npm run build  # Frontend 빌드
pm2 restart camping-backend        # Backend 재시작
```

### 참고 문서

- [USER_MANUAL.md](./USER_MANUAL.md) - 사용자 매뉴얼
- [OPERATOR_MANUAL.md](./OPERATOR_MANUAL.md) - 운영자 매뉴얼 (상세)
- [README.md](./README.md) - 프로젝트 개요
- [.github/workflows/README.md](./.github/workflows/README.md) - GitHub Actions 가이드

### 온라인 리소스

- [PM2 공식 문서](https://pm2.keymetrics.io/docs/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)
- [Firebase 문서](https://firebase.google.com/docs)
- [Node.js 문서](https://nodejs.org/docs/)

---

**배포 성공을 기원합니다! 🎉**

문제가 발생하면 OPERATOR_MANUAL.md의 트러블슈팅 섹션을 참고하세요.
