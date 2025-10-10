# 캠핑장 예약 알림 시스템 - 운영자 매뉴얼

## 📖 목차

1. [시스템 개요](#시스템-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [서버 설치 및 배포](#서버-설치-및-배포)
4. [시스템 설정](#시스템-설정)
5. [시스템 운영](#시스템-운영)
6. [모니터링 및 로그 관리](#모니터링-및-로그-관리)
7. [백업 및 복구](#백업-및-복구)
8. [트러블슈팅](#트러블슈팅)
9. [보안 관리](#보안-관리)
10. [성능 최적화](#성능-최적화)
11. [유지보수 가이드](#유지보수-가이드)

---

## 시스템 개요

### 시스템 구성

```
┌─────────────────────────────────────────────────────┐
│                   사용자 (Browser)                    │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                 │
│          - 사용자 인터페이스                          │
│          - Firebase Auth 연동                        │
└────────────────────┬────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────┐
│         Backend (Node.js + Express)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Scheduler Service (node-cron)                │  │
│  │  - 매분 실행 (1-20초 랜덤 딜레이)              │  │
│  │  - 스크래핑 → 알림 체크 → Firestore 저장      │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Scraper Service (Playwright)                 │  │
│  │  - Headless 브라우저 기반 스크래핑             │  │
│  │  - 3개월 데이터 수집 (현재월 + 2개월)         │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Notification Service (Nodemailer)            │  │
│  │  - Gmail SMTP 이메일 전송                     │  │
│  │  - 24시간 중복 알림 방지                      │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         Firebase (Cloud Services)                    │
│  - Authentication (사용자 인증)                      │
│  - Firestore (NoSQL Database)                        │
│    ├─ users                                          │
│    ├─ userSettings                                   │
│    ├─ availability                                   │
│    ├─ notifications                                  │
│    └─ scrapingLogs                                   │
└─────────────────────────────────────────────────────┘
```

### 기술 스택

**Backend**
- Node.js 18+ (ES Modules)
- Express.js (REST API)
- Playwright (웹 스크래핑)
- node-cron (스케줄러)
- Firebase Admin SDK (인증/DB)
- Nodemailer (이메일 전송)

**Frontend**
- React 18+
- Vite (빌드 도구)
- Ant Design (UI 컴포넌트)
- Tailwind CSS (스타일링)
- Firebase Client SDK (인증)
- Axios (HTTP 클라이언트)

**Infrastructure**
- Firebase Authentication
- Firestore Database
- Gmail SMTP (이메일)

---

## 시스템 아키텍처

### 데이터 플로우

#### 1. 스크래핑 플로우
```
Scheduler (매분 실행)
    ↓
Sleep 시간 체크 (01:00-08:00 KST)
    ↓
활성 설정 확인 (미래 날짜 포함 여부)
    ↓
Scraper Service 실행
    ↓
Playwright로 캠핑장 사이트 접속
    ↓
3개월 데이터 파싱 (현재월, +1월, +2월)
    ↓
Firestore에 저장 (availability 컬렉션)
    ↓
Scraping Log 기록 (scrapingLogs 컬렉션)
```

#### 2. 알림 플로우
```
스크래핑 완료 후 실행
    ↓
모든 활성 UserSettings 조회
    ↓
각 설정별로 조건 매칭
    - campingName
    - region
    - area[] (OR 조건)
    - dateRange (From ~ To)
    ↓
매칭된 availability 확인
    ↓
중복 알림 체크 (24시간 내 동일 알림)
    ↓
이메일 전송 (Nodemailer + Gmail)
    ↓
Notification Log 기록
```

#### 3. API 인증 플로우
```
Frontend에서 API 호출
    ↓
Axios Interceptor에서 Firebase ID Token 추가
    ↓
Backend auth.middleware.js
    ↓
Firebase Admin SDK로 토큰 검증
    ↓
사용자 정보 추출 (req.user)
    ↓
API 핸들러 실행
```

### Firestore 스키마

#### users 컬렉션
```javascript
{
  uid: "firebase-user-id",           // Document ID
  email: "user@example.com",
  displayName: "홍길동",
  notificationEmail: "notify@example.com",  // 알림 받을 이메일 (optional)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### userSettings 컬렉션
```javascript
{
  id: "auto-generated-id",           // Document ID
  userId: "firebase-user-id",
  campingName: "다리안계곡캠핑장",
  region: "경기도",
  area: ["데크A", "데크B"],          // 배열
  dateFrom: "2025-11-01",            // YYYY-MM-DD
  dateTo: "2025-11-03",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### availability 컬렉션
```javascript
{
  id: "auto-generated-id",           // Document ID
  campingName: "다리안계곡캠핑장",
  region: "경기도",
  area: "데크A",
  date: "2025-11-01",
  availableCount: 3,
  scrapedAt: Timestamp
}
```

#### notifications 컬렉션
```javascript
{
  id: "auto-generated-id",           // Document ID
  userId: "firebase-user-id",
  settingId: "user-setting-id",
  campingName: "다리안계곡캠핑장",
  area: "데크A",
  date: "2025-11-01",
  notificationType: "email",
  sentAt: Timestamp
}
```

#### scrapingLogs 컬렉션
```javascript
{
  id: "auto-generated-id",           // Document ID
  startedAt: Timestamp,
  completedAt: Timestamp,
  status: "success" | "error" | "running",
  itemsScraped: 180,                 // 스크래핑된 항목 수
  errorMessage: null | "error details"
}
```

---

## 서버 설치 및 배포

### 1. 사전 요구사항

#### 서버 스펙 (최소)
- **OS**: Ubuntu 20.04 LTS 이상, CentOS 8+, Debian 10+
- **CPU**: 2 Core 이상
- **RAM**: 2GB 이상 (Playwright 실행 고려)
- **Storage**: 20GB 이상
- **네트워크**: 고정 IP 또는 도메인

#### 필수 소프트웨어
- Node.js 18.x 이상
- npm 9.x 이상
- Git
- PM2 (프로세스 관리)
- Nginx 또는 Apache (웹 서버)

### 2. 서버 준비

#### 2.1 Node.js 설치
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 설치 확인
node --version  # v20.x.x
npm --version   # 9.x.x
```

#### 2.2 Git 설치
```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

#### 2.3 PM2 설치 (전역)
```bash
sudo npm install -g pm2

# PM2 설치 확인
pm2 --version
```

#### 2.4 Playwright 시스템 의존성 설치
```bash
# Ubuntu/Debian
sudo apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2

# Playwright 브라우저 설치는 npm install 시 자동 실행
```

### 3. 애플리케이션 배포

#### 3.1 저장소 클론
```bash
# 배포 디렉토리로 이동
cd /var/www
# 또는 원하는 위치
cd /home/username

# GitHub에서 클론
git clone https://github.com/kwhong/camping-reservation-notifier.git
cd camping-reservation-notifier
```

#### 3.2 Backend 설정

```bash
cd backend

# 패키지 설치
npm install

# .env 파일 생성
nano .env
```

**.env 파일 내용**:
```env
PORT=3000
NODE_ENV=production
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
```

**Gmail App Password 발급 방법**:
1. Google 계정 → 보안
2. 2단계 인증 활성화
3. "앱 비밀번호" 생성
4. "메일" 선택, "기타" 선택
5. 생성된 16자리 비밀번호를 `EMAIL_APP_PASSWORD`에 입력

#### 3.3 Firebase 서비스 계정 설정

1. Firebase Console (https://console.firebase.google.com/) 접속
2. 프로젝트 설정 → 서비스 계정
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드
5. 파일을 프로젝트 루트에 저장:
   ```bash
   # 프로젝트 루트로 이동
   cd /var/www/camping-reservation-notifier

   # JSON 파일 업로드 (파일명: camping-scraper-prod-firebase-설정.json)
   # SCP 또는 SFTP로 업로드
   ```

6. 파일 권한 설정:
   ```bash
   chmod 600 camping-scraper-prod-firebase-설정.json
   ```

#### 3.4 Backend 실행

**수동 실행 (테스트)**:
```bash
cd backend
npm start
```

**PM2로 실행 (프로덕션)**:
```bash
cd backend

# PM2로 시작
pm2 start src/app.js --name camping-backend

# PM2 프로세스 확인
pm2 list

# 로그 확인
pm2 logs camping-backend

# 서버 재시작시 자동 시작 설정
pm2 startup
pm2 save
```

**PM2 주요 명령어**:
```bash
pm2 start camping-backend      # 시작
pm2 stop camping-backend       # 정지
pm2 restart camping-backend    # 재시작
pm2 delete camping-backend     # 삭제
pm2 logs camping-backend       # 로그 실시간 확인
pm2 logs camping-backend --lines 100  # 최근 100줄
pm2 monit                      # 모니터링 화면
```

#### 3.5 Frontend 빌드 및 배포

```bash
cd ../frontend

# 패키지 설치
npm install

# .env 파일 생성
nano .env
```

**.env 파일 내용**:
```env
VITE_API_URL=http://your-server-ip:3000/api
# 또는 도메인 사용시
VITE_API_URL=https://yourdomain.com/api
```

**Firebase 클라이언트 설정 (필요시 수정)**:
```bash
nano src/services/firebase.js
```

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

**프로덕션 빌드**:
```bash
npm run build

# 빌드 완료 확인
ls -la dist/
```

### 4. Nginx 웹 서버 설정

#### 4.1 Nginx 설치
```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx

# 시작 및 자동 시작 설정
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 4.2 Nginx 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/camping-notifier
```

**설정 내용**:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # 또는 IP 사용시
    # server_name 123.456.789.0;

    # Frontend (React 빌드 파일)
    root /var/www/camping-reservation-notifier/frontend/dist;
    index index.html;

    # Frontend 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API 프록시
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.3 Nginx 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/camping-notifier /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

#### 4.4 SSL 인증서 설치 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

**SSL 적용 후 Nginx 설정 (자동 생성됨)**:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... (나머지 설정 동일)
}

# HTTP to HTTPS 리다이렉트
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 5. 방화벽 설정

#### UFW (Ubuntu)
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

#### FirewallD (CentOS)
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 6. 배포 확인

#### Backend 확인
```bash
# 헬스 체크
curl http://localhost:3000/health

# 응답 예시
# {"status":"ok","timestamp":"2025-10-10T12:00:00.000Z"}
```

#### Frontend 확인
```bash
# 브라우저에서 접속
http://your-domain.com
# 또는
https://your-domain.com
```

#### PM2 확인
```bash
pm2 status
pm2 logs camping-backend --lines 50
```

---

## 시스템 설정

### 1. Firebase 설정

#### 1.1 Firestore 데이터베이스 생성
1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치 선택 (asia-northeast3 - 서울)
4. 프로덕션 모드로 시작

#### 1.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // users 컬렉션
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // userSettings 컬렉션
    match /userSettings/{settingId} {
      allow read, write: if isSignedIn() &&
        resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() &&
        request.resource.data.userId == request.auth.uid;
    }

    // availability 컬렉션 (읽기만 허용)
    match /availability/{availId} {
      allow read: if isSignedIn();
      allow write: if false;  // Backend에서만 쓰기
    }

    // notifications 컬렉션 (읽기만 허용)
    match /notifications/{notifId} {
      allow read: if isSignedIn() &&
        resource.data.userId == request.auth.uid;
      allow write: if false;  // Backend에서만 쓰기
    }

    // scrapingLogs 컬렉션 (읽기만 허용)
    match /scrapingLogs/{logId} {
      allow read: if isSignedIn();
      allow write: if false;  // Backend에서만 쓰기
    }
  }
}
```

#### 1.3 Firestore 인덱스 생성

**backend/firestore.indexes.json** 파일 사용:
```bash
cd backend
firebase deploy --only firestore:indexes
```

또는 Firebase Console에서 수동 생성:
1. Firestore → 인덱스 탭
2. 복합 인덱스 추가:

**availability 인덱스**:
- campingName (오름차순)
- region (오름차순)
- area (오름차순)
- date (오름차순)

**notifications 인덱스**:
- userId (오름차순)
- sentAt (내림차순)

**scrapingLogs 인덱스**:
- startedAt (내림차순)

#### 1.4 Firebase Authentication 설정

1. Firebase Console → Authentication
2. 로그인 방법 탭
3. 이메일/비밀번호 활성화
4. Google 로그인 활성화
5. 승인된 도메인에 본인 도메인 추가

### 2. 스케줄러 설정

**backend/src/services/scheduler.service.js**:

```javascript
// 스케줄: 매분 실행
cron.schedule('* * * * *', async () => {
  // ...
});

// 랜덤 딜레이: 5-20초
const delay = getRandomDelay(5000, 20000);

// Sleep 시간: 01:00-08:00 KST
if (isSleepTime(koreaTime)) {
  console.log('😴 Sleep 시간입니다. 스크래핑을 건너뜁니다.');
  return;
}
```

**설정 변경** (필요시):
```javascript
// 매 5분마다 실행
cron.schedule('*/5 * * * *', async () => {
  // ...
});

// Sleep 시간 변경 (backend/src/utils/date.js)
export function isSleepTime(date) {
  const hour = date.getHours();
  return hour >= 2 && hour < 9;  // 02:00-09:00으로 변경
}
```

### 3. 이메일 설정

**backend/src/config/email.js**:

```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});
```

**Gmail 일일 전송 제한**:
- 무료 Gmail: 500통/일
- Google Workspace: 2,000통/일

**대안 SMTP 서비스** (대량 전송 필요시):
- SendGrid
- AWS SES
- Mailgun

### 4. 로그 설정

**backend/src/utils/logger.js**:

현재는 console.log 사용. 프로덕션 환경에서는 Winston 또는 Pino 사용 권장.

**Winston 설정 예시**:
```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

---

## 시스템 운영

### 1. 일상 운영 작업

#### 매일 체크리스트
- [ ] PM2 프로세스 상태 확인
- [ ] 최근 스크래핑 로그 확인
- [ ] 에러 로그 확인
- [ ] 디스크 사용량 확인
- [ ] 메모리 사용량 확인

#### 매주 체크리스트
- [ ] Firestore 데이터 크기 확인
- [ ] 백업 상태 확인
- [ ] SSL 인증서 만료일 확인
- [ ] 시스템 보안 업데이트

#### 매월 체크리스트
- [ ] 전체 시스템 점검
- [ ] 성능 분석
- [ ] 사용자 피드백 검토
- [ ] 코드 업데이트 검토

### 2. 일상 명령어

#### 시스템 상태 확인
```bash
# PM2 프로세스 확인
pm2 status

# 리소스 사용량 확인
pm2 monit

# 최근 로그 확인
pm2 logs camping-backend --lines 100

# 실시간 로그
pm2 logs camping-backend
```

#### Backend 관리
```bash
# 재시작
pm2 restart camping-backend

# 정지
pm2 stop camping-backend

# 시작
pm2 start camping-backend

# 삭제
pm2 delete camping-backend

# 로그 비우기
pm2 flush
```

#### 시스템 리소스 확인
```bash
# CPU/메모리 사용량
htop
# 또는
top

# 디스크 사용량
df -h

# 특정 디렉토리 크기
du -sh /var/www/camping-reservation-notifier

# 메모리 상태
free -h
```

#### Nginx 관리
```bash
# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 리로드 (무중단)
sudo systemctl reload nginx

# 로그 확인
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. 코드 업데이트

#### Git에서 최신 코드 가져오기
```bash
cd /var/www/camping-reservation-notifier

# 백업 (선택사항)
git branch backup-$(date +%Y%m%d)

# 최신 코드 가져오기
git pull origin main

# Backend 업데이트
cd backend
npm install
pm2 restart camping-backend

# Frontend 업데이트
cd ../frontend
npm install
npm run build

# Nginx 재시작 (필요시)
sudo systemctl reload nginx
```

#### 롤백 (문제 발생시)
```bash
cd /var/www/camping-reservation-notifier

# 이전 커밋으로 복구
git log --oneline  # 커밋 해시 확인
git checkout <commit-hash>

# Backend 재시작
cd backend
npm install
pm2 restart camping-backend

# Frontend 재빌드
cd ../frontend
npm install
npm run build
```

---

## 모니터링 및 로그 관리

### 1. 로그 위치

#### PM2 로그
```bash
# 로그 경로
~/.pm2/logs/

# camping-backend 로그
~/.pm2/logs/camping-backend-out.log  # stdout
~/.pm2/logs/camping-backend-error.log  # stderr
```

#### Nginx 로그
```bash
/var/log/nginx/access.log  # 접근 로그
/var/log/nginx/error.log   # 에러 로그
```

### 2. 로그 확인

#### 실시간 로그 모니터링
```bash
# PM2 로그
pm2 logs camping-backend

# Nginx 접근 로그
sudo tail -f /var/log/nginx/access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# 여러 로그 동시 확인
tail -f ~/.pm2/logs/camping-backend-*.log
```

#### 특정 키워드 검색
```bash
# 에러 검색
grep "ERROR" ~/.pm2/logs/camping-backend-error.log

# 최근 1시간 에러
grep "ERROR" ~/.pm2/logs/camping-backend-error.log | tail -100

# 스크래핑 성공 로그
grep "✅ 스크래핑 완료" ~/.pm2/logs/camping-backend-out.log
```

### 3. Firestore 로그 확인

#### 스크래핑 로그 조회 (Firebase Console)
1. Firestore → scrapingLogs 컬렉션
2. 최근 실행 확인
3. status: "error" 필터링하여 에러 확인

#### 알림 로그 조회
1. Firestore → notifications 컬렉션
2. userId로 필터링
3. sentAt 정렬

### 4. 로그 로테이션

**PM2 로그 로테이션**:
```bash
# pm2-logrotate 설치
pm2 install pm2-logrotate

# 설정
pm2 set pm2-logrotate:max_size 10M      # 최대 파일 크기
pm2 set pm2-logrotate:retain 7          # 보관 일수
pm2 set pm2-logrotate:compress true     # 압축 활성화
```

**Nginx 로그 로테이션** (logrotate 사용):
```bash
sudo nano /etc/logrotate.d/nginx
```

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 5. 알림 및 경고

#### PM2 알림 설정
```bash
# pm2-slack 설치 (Slack 알림)
pm2 install pm2-slack

# Webhook URL 설정
pm2 set pm2-slack:slack_url https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### 이메일 알림 (프로세스 크래시 시)
PM2 Keymetrics 사용 또는 커스텀 스크립트 작성

---

## 백업 및 복구

### 1. Firestore 백업

#### 자동 백업 (Firebase Console)
1. Firebase Console → Firestore → 백업
2. 예약된 백업 설정
3. Cloud Storage 버킷 지정

#### 수동 내보내기 (gcloud CLI)
```bash
# gcloud 설치
curl https://sdk.cloud.google.com | bash

# 인증
gcloud auth login

# 프로젝트 설정
gcloud config set project camping-scraper-prod

# Firestore 내보내기
gcloud firestore export gs://your-bucket-name/backups/$(date +%Y%m%d)
```

#### 복원
```bash
gcloud firestore import gs://your-bucket-name/backups/20251010
```

### 2. 코드 백업

#### Git 백업 (자동)
- GitHub에 코드가 자동으로 백업됨

#### 서버 파일 백업
```bash
# 전체 프로젝트 백업
tar -czf camping-backup-$(date +%Y%m%d).tar.gz \
  /var/www/camping-reservation-notifier \
  --exclude=node_modules \
  --exclude=.git

# 백업 파일을 안전한 위치로 이동
mv camping-backup-*.tar.gz /backup/
```

#### 정기 백업 (cron)
```bash
crontab -e
```

```cron
# 매일 새벽 2시 백업
0 2 * * * /path/to/backup-script.sh
```

**backup-script.sh**:
```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d)

# 코드 백업
tar -czf $BACKUP_DIR/code-$DATE.tar.gz \
  /var/www/camping-reservation-notifier \
  --exclude=node_modules \
  --exclude=.git

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "code-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 3. 환경 변수 백업

```bash
# .env 파일 백업 (암호화 권장)
cp backend/.env backend/.env.backup

# 안전한 위치에 보관 (Git에는 절대 올리지 말 것!)
```

### 4. 복구 절차

#### 전체 시스템 복구
```bash
# 1. 코드 복구
cd /var/www
tar -xzf /backup/code-20251010.tar.gz

# 2. 패키지 재설치
cd camping-reservation-notifier/backend
npm install

cd ../frontend
npm install
npm run build

# 3. PM2 재시작
pm2 restart camping-backend

# 4. Nginx 재시작
sudo systemctl restart nginx
```

#### Firestore 데이터 복구
```bash
gcloud firestore import gs://your-bucket-name/backups/20251010
```

---

## 트러블슈팅

### 1. Backend 문제

#### 증상: Backend가 시작되지 않음

**원인 확인**:
```bash
# PM2 로그 확인
pm2 logs camping-backend --lines 50

# 직접 실행으로 에러 확인
cd backend
node src/app.js
```

**일반적인 원인**:
1. **포트 충돌**:
   ```bash
   # 포트 사용 확인
   sudo lsof -i :3000
   sudo netstat -tulpn | grep :3000

   # 프로세스 종료
   sudo kill -9 <PID>
   ```

2. **환경 변수 누락**:
   ```bash
   # .env 파일 확인
   cat backend/.env

   # 필수 변수 확인
   # PORT, NODE_ENV, EMAIL_USER, EMAIL_APP_PASSWORD
   ```

3. **Firebase 서비스 계정 파일 누락**:
   ```bash
   # 파일 존재 확인
   ls -la camping-scraper-prod-firebase-*.json

   # 경로 확인 (backend/src/config/firebase.js)
   ```

4. **패키지 설치 오류**:
   ```bash
   # node_modules 삭제 후 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

#### 증상: 스크래핑이 실행되지 않음

**원인 확인**:
```bash
# 로그 확인
pm2 logs camping-backend | grep "스크래핑"

# Firestore scrapingLogs 확인
# Firebase Console → scrapingLogs 컬렉션
```

**일반적인 원인**:
1. **Sleep 시간 (01:00-08:00 KST)**:
   - 로그에 "😴 Sleep 시간입니다" 메시지 확인
   - 정상 동작

2. **활성 설정 없음**:
   - 로그에 "⏭️ 활성화된 설정이 없습니다" 메시지
   - userSettings 컬렉션에 isActive: true인 설정 확인

3. **Playwright 실행 오류**:
   ```bash
   # Playwright 브라우저 재설치
   cd backend
   npx playwright install chromium

   # 시스템 의존성 설치
   npx playwright install-deps
   ```

4. **타겟 사이트 구조 변경**:
   - mirihae.com 사이트 구조가 변경되었을 수 있음
   - backend/src/services/scraper.service.js 파싱 로직 수정 필요

#### 증상: 알림 이메일이 전송되지 않음

**원인 확인**:
```bash
# 로그 확인
pm2 logs camping-backend | grep "이메일"

# Firestore notifications 확인
# Firebase Console → notifications 컬렉션
```

**일반적인 원인**:
1. **Gmail 인증 실패**:
   ```bash
   # .env 확인
   cat backend/.env | grep EMAIL

   # Gmail App Password 재생성
   # Google 계정 → 보안 → 앱 비밀번호
   ```

2. **Gmail 전송 제한**:
   - 일일 500통 제한 확인
   - Google Workspace 계정 사용 검토

3. **24시간 중복 알림 방지**:
   - 동일 캠핑장-구역-날짜는 24시간 내 1회만 전송
   - notifications 컬렉션에서 최근 알림 확인

### 2. Frontend 문제

#### 증상: 로그인이 되지 않음

**원인 확인**:
1. **Firebase 연결 확인**:
   - 브라우저 개발자 도구 → Console 확인
   - Network 탭에서 Firebase API 호출 확인

2. **Firebase 설정 확인**:
   ```bash
   # frontend/src/services/firebase.js 확인
   cat frontend/src/services/firebase.js
   ```

3. **승인된 도메인 확인**:
   - Firebase Console → Authentication → 설정 → 승인된 도메인
   - 본인 도메인이 추가되어 있는지 확인

#### 증상: API 호출 실패

**원인 확인**:
```bash
# 브라우저 개발자 도구 → Console
# 401 Unauthorized: Firebase 토큰 문제
# 404 Not Found: API 경로 문제
# 500 Internal Server Error: Backend 에러
```

**일반적인 원인**:
1. **Backend API URL 오류**:
   ```bash
   # frontend/.env 확인
   cat frontend/.env

   # VITE_API_URL이 올바른지 확인
   # http://your-domain.com/api (뒤에 /api 필수)
   ```

2. **CORS 문제**:
   - Backend에서 Frontend 도메인 허용 확인
   - backend/src/app.js의 CORS 설정 확인

3. **Nginx 프록시 설정 오류**:
   ```bash
   # Nginx 설정 확인
   sudo nano /etc/nginx/sites-available/camping-notifier

   # location /api 블록 확인
   # proxy_pass http://localhost:3000; 확인
   ```

#### 증상: 화면이 흰색으로만 표시됨

**원인 확인**:
```bash
# 브라우저 개발자 도구 → Console에서 에러 확인
```

**일반적인 원인**:
1. **빌드 오류**:
   ```bash
   cd frontend
   npm run build
   # 빌드 에러 확인
   ```

2. **파일 경로 문제**:
   ```bash
   # Nginx root 경로 확인
   sudo nano /etc/nginx/sites-available/camping-notifier

   # root /var/www/camping-reservation-notifier/frontend/dist;
   # 경로가 정확한지 확인
   ```

3. **JavaScript 실행 오류**:
   - 브라우저 Console에서 에러 메시지 확인
   - React 컴포넌트 에러

### 3. Firestore 문제

#### 증상: Firestore 쓰기 실패

**원인 확인**:
```bash
# Backend 로그 확인
pm2 logs camping-backend | grep "Firestore"
```

**일반적인 원인**:
1. **Security Rules 위반**:
   - Firebase Console → Firestore → 규칙 탭
   - 규칙이 너무 제한적인지 확인

2. **서비스 계정 권한 부족**:
   - Firebase Console → 프로젝트 설정 → 서비스 계정
   - 역할이 "편집자" 이상인지 확인

3. **할당량 초과**:
   - Firebase Console → Firestore → 사용량
   - 읽기/쓰기 제한 확인

#### 증상: Firestore 연결 느림

**원인**:
- Firestore 리전이 멀리 있음
- 인덱스 누락

**해결**:
1. **인덱스 생성**:
   - Firebase Console → Firestore → 인덱스 탭
   - 필요한 복합 인덱스 생성

2. **쿼리 최적화**:
   - 불필요한 쿼리 제거
   - 페이지네이션 적용

### 4. 네트워크 문제

#### 증상: 외부에서 접속 안 됨

**원인 확인**:
```bash
# 방화벽 확인
sudo ufw status

# Nginx 상태 확인
sudo systemctl status nginx

# 포트 리스닝 확인
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

**해결**:
```bash
# 방화벽 포트 열기
sudo ufw allow 'Nginx Full'

# Nginx 재시작
sudo systemctl restart nginx
```

#### 증상: HTTPS 인증서 오류

**원인 확인**:
```bash
# 인증서 만료일 확인
sudo certbot certificates
```

**해결**:
```bash
# 인증서 갱신
sudo certbot renew

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 보안 관리

### 1. 환경 변수 보안

#### 중요 파일 권한 설정
```bash
# .env 파일 권한
chmod 600 backend/.env
chmod 600 frontend/.env

# Firebase 서비스 계정 파일
chmod 600 camping-scraper-prod-firebase-*.json

# 소유자 확인
ls -la backend/.env
# -rw------- 1 user user ... backend/.env
```

#### 환경 변수 암호화 (선택사항)
```bash
# ansible-vault 사용
ansible-vault encrypt backend/.env

# 복호화
ansible-vault decrypt backend/.env
```

### 2. Firebase 보안

#### Security Rules 검토
- 최소 권한 원칙 적용
- 인증된 사용자만 접근
- 자신의 데이터만 읽기/쓰기

#### 서비스 계정 키 관리
- 절대 Git에 커밋하지 말 것
- 정기적으로 키 로테이션
- 필요한 권한만 부여

### 3. SSH 보안

#### SSH 키 인증 설정
```bash
# 비밀번호 로그인 비활성화
sudo nano /etc/ssh/sshd_config

# 설정 변경
PasswordAuthentication no
PubkeyAuthentication yes

# SSH 재시작
sudo systemctl restart sshd
```

#### Fail2Ban 설치 (무차별 대입 공격 방어)
```bash
sudo apt-get install fail2ban

# 설정
sudo nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
sudo systemctl restart fail2ban
```

### 4. 서버 보안 업데이트

#### 자동 보안 업데이트
```bash
# Ubuntu
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# 설정 확인
cat /etc/apt/apt.conf.d/50unattended-upgrades
```

#### 수동 업데이트
```bash
# 패키지 목록 업데이트
sudo apt-get update

# 보안 업데이트만 설치
sudo apt-get upgrade

# 전체 업그레이드
sudo apt-get dist-upgrade
```

### 5. 애플리케이션 보안

#### Node.js 패키지 취약점 검사
```bash
cd backend
npm audit

# 자동 수정
npm audit fix

# 강제 수정 (주의!)
npm audit fix --force
```

#### 의존성 업데이트
```bash
# 최신 버전 확인
npm outdated

# 업데이트
npm update

# 특정 패키지 업데이트
npm install express@latest
```

### 6. Nginx 보안

#### HTTP 헤더 보안 설정
```nginx
# /etc/nginx/sites-available/camping-notifier

server {
    # ... 기존 설정 ...

    # 보안 헤더 추가
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;" always;

    # 서버 버전 숨기기
    server_tokens off;
}
```

#### Rate Limiting
```nginx
# /etc/nginx/nginx.conf

http {
    # Rate limit zone 정의
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # ... 기타 설정 ...
}
```

```nginx
# /etc/nginx/sites-available/camping-notifier

location /api {
    # Rate limiting 적용
    limit_req zone=api_limit burst=20 nodelay;

    # ... 프록시 설정 ...
}
```

---

## 성능 최적화

### 1. Backend 최적화

#### PM2 클러스터 모드
```bash
# ecosystem.config.js 생성
nano backend/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'camping-backend',
    script: './src/app.js',
    instances: 2,  // CPU 코어 수에 맞게 조정
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
# 클러스터 모드로 시작
pm2 start backend/ecosystem.config.js
```

#### 메모리 제한 설정
```bash
pm2 start src/app.js --name camping-backend --max-memory-restart 500M
```

### 2. Firestore 최적화

#### 쿼리 최적화
```javascript
// Bad: 모든 문서 가져온 후 필터링
const allDocs = await db.collection('availability').get();
const filtered = allDocs.docs.filter(doc => doc.data().date > today);

// Good: 쿼리에서 필터링
const query = db.collection('availability')
  .where('date', '>', today)
  .limit(100);
const docs = await query.get();
```

#### 인덱스 활용
- 복합 쿼리에 인덱스 생성
- Firebase Console에서 인덱스 자동 제안 활용

#### 페이지네이션
```javascript
// 페이지네이션 예시
const query = db.collection('availability')
  .orderBy('date')
  .limit(50)
  .startAfter(lastDoc);
```

### 3. Frontend 최적화

#### 프로덕션 빌드 최적화
```bash
# 빌드시 소스맵 비활성화
VITE_SOURCEMAP=false npm run build

# 번들 크기 분석
npm install --save-dev rollup-plugin-visualizer
```

#### 코드 스플리팅
```javascript
// React lazy loading
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### 4. Nginx 최적화

#### Gzip 압축
```nginx
# /etc/nginx/nginx.conf

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

#### 정적 파일 캐싱
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 커넥션 최적화
```nginx
# /etc/nginx/nginx.conf

worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
```

---

## 유지보수 가이드

### 1. 정기 점검 항목

#### 일간 점검
```bash
#!/bin/bash
# daily-check.sh

echo "=== 일일 점검 시작 ==="
echo "날짜: $(date)"

# PM2 상태
echo "--- PM2 상태 ---"
pm2 status

# 최근 에러 로그
echo "--- 최근 에러 로그 ---"
pm2 logs camping-backend --err --lines 10

# 디스크 사용량
echo "--- 디스크 사용량 ---"
df -h | grep -E "Filesystem|/dev/"

# 메모리 사용량
echo "--- 메모리 사용량 ---"
free -h

echo "=== 일일 점검 완료 ==="
```

#### 주간 점검
```bash
#!/bin/bash
# weekly-check.sh

# 패키지 업데이트 확인
echo "--- 패키지 업데이트 확인 ---"
cd /var/www/camping-reservation-notifier/backend
npm outdated

cd ../frontend
npm outdated

# SSL 인증서 만료일
echo "--- SSL 인증서 ---"
sudo certbot certificates

# Firestore 사용량 (수동 확인 필요)
echo "Firebase Console에서 Firestore 사용량 확인 필요"
```

### 2. 캠핑장 사이트 변경 대응

#### HTML 구조 변경 감지
- 스크래핑 에러 발생시 즉시 확인
- scrapingLogs에서 status: "error" 확인

#### 파싱 로직 수정
```bash
# 1. 현재 사이트 구조 확인
cd backend
node src/services/scraper.service.js  # 테스트 실행

# 2. scraper.service.js 수정
nano src/services/scraper.service.js

# 3. 변경사항:
# - HTML 선택자 (.element, dl, dt, dd 등)
# - 데이터 파싱 로직
# - 에러 핸들링

# 4. 테스트
npm start

# 5. 배포
pm2 restart camping-backend
```

### 3. 기능 추가/변경

#### 새 캠핑장 추가
1. scraper.service.js에 새 스크래핑 로직 추가
2. Frontend에서 캠핑장 선택 옵션 추가
3. Firestore 데이터 구조 확장 (필요시)

#### 알림 채널 추가 (SMS, 카카오톡 등)
1. notification.service.js에 새 채널 로직 추가
2. 환경 변수에 API 키 추가
3. Frontend에서 알림 채널 선택 UI 추가

### 4. 데이터베이스 유지보수

#### 오래된 데이터 정리
```javascript
// cleanup-script.js
import { db } from './config/firebase.js';

async function cleanupOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 30일 이전 availability 삭제
  const oldDocs = await db.collection('availability')
    .where('scrapedAt', '<', thirtyDaysAgo)
    .get();

  const batch = db.batch();
  oldDocs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`${oldDocs.size} documents deleted`);
}

cleanupOldData();
```

#### Cron으로 자동 실행
```bash
crontab -e
```

```cron
# 매주 일요일 새벽 3시 데이터 정리
0 3 * * 0 cd /var/www/camping-reservation-notifier/backend && node cleanup-script.js
```

---

## 부록

### A. 시스템 사양 권장사항

#### 소규모 (사용자 100명 이하)
- CPU: 2 Core
- RAM: 2GB
- Storage: 20GB
- 네트워크: 1Gbps

#### 중규모 (사용자 100-1000명)
- CPU: 4 Core
- RAM: 4GB
- Storage: 50GB
- 네트워크: 1Gbps

#### 대규모 (사용자 1000명 이상)
- CPU: 8+ Core
- RAM: 8GB+
- Storage: 100GB+
- 네트워크: 10Gbps
- 로드 밸런서 고려

### B. 주요 디렉토리 구조

```
camping-reservation-notifier/
├── .github/
│   └── workflows/           # GitHub Actions 워크플로우
├── backend/
│   ├── src/
│   │   ├── app.js          # 애플리케이션 진입점
│   │   ├── config/         # 설정 파일
│   │   ├── middleware/     # Express 미들웨어
│   │   ├── routes/         # API 라우트
│   │   ├── services/       # 비즈니스 로직
│   │   └── utils/          # 유틸리티 함수
│   ├── .env                # 환경 변수 (Git 제외)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── contexts/       # React Context
│   │   ├── services/       # API 클라이언트
│   │   └── main.jsx        # 애플리케이션 진입점
│   ├── dist/               # 빌드 결과물
│   ├── .env                # 환경 변수 (Git 제외)
│   └── package.json
├── camping-scraper-prod-firebase-*.json  # Firebase 서비스 계정 (Git 제외)
├── .gitignore
├── README.md
├── USER_MANUAL.md          # 사용자 매뉴얼
└── OPERATOR_MANUAL.md      # 운영자 매뉴얼 (본 문서)
```

### C. 연락처 및 지원

**기술 지원**:
- GitHub Issues: https://github.com/kwhong/camping-reservation-notifier/issues
- 이메일: [관리자 이메일]

**긴급 연락**:
- 전화: [관리자 전화번호]
- 근무 시간: 평일 09:00-18:00

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-10-10
**작성자**: Claude Code
