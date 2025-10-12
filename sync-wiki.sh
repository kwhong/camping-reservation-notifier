#!/bin/bash
# Sync documentation to GitHub Wiki
# Usage: ./sync-wiki.sh

set -e

echo "🚀 Starting Wiki sync..."

# Check if Wiki is enabled
if ! git ls-remote https://github.com/kwhong/camping-reservation-notifier.wiki.git &>/dev/null; then
    echo "❌ Wiki is not enabled for this repository."
    echo ""
    echo "To enable Wiki:"
    echo "1. Go to https://github.com/kwhong/camping-reservation-notifier/settings"
    echo "2. Check 'Wikis' under Features section"
    echo "3. Create the first page on the Wiki tab"
    echo "4. Run this script again"
    exit 1
fi

# Clone Wiki repository
echo "📥 Cloning Wiki repository..."
rm -rf wiki-temp
git clone https://github.com/kwhong/camping-reservation-notifier.wiki.git wiki-temp
cd wiki-temp

# Create Home page
echo "📝 Creating Home page..."
cat > Home.md <<'EOF'
# Camping Reservation Notifier Wiki

캠핑장 예약 알림 시스템의 공식 위키입니다.

## 📚 문서 목차

### ⭐ 시작하기
- **[Getting Started](Getting-Started)** - 5분 빠른 시작 가이드

### 👤 사용자 가이드
- [사용자 매뉴얼](User-Manual) - 시스템 사용법
- [외부 접속 설정](External-Access) - Cloudflare Tunnel

### 🛠️ 운영자 가이드
- [운영자 매뉴얼](Operator-Manual) - 시스템 운영 및 관리
- [배포 가이드](Deployment-Guide) - 프로덕션 배포
- [테스트 가이드](Testing-Guide) - 시스템 테스트

### 💻 개발자 가이드
- [API 문서](API-Documentation) - REST API 명세 (OpenAPI)
- [API 클라이언트 생성](API-Client-Generation) - TypeScript 클라이언트
- [시스템 헬스 체크](System-Health-Check) - 전체 시스템 점검

### 📊 개선 프로젝트
- [개선 계획](Improvement-Plan) - Phase 0-6 개선 계획
- [최종 리포트](Final-Report) - 개선 프로젝트 완료 리포트
- [보안 패치](Security-Patch) - 보안 취약점 수정 내역

### 🔧 참고 자료
- [문제 해결](Troubleshooting) - 일반적인 문제 해결
- [FAQ](FAQ) - 자주 묻는 질문

---

## 🔗 외부 링크

- [GitHub 리포지토리](https://github.com/kwhong/camping-reservation-notifier)
- [이슈 트래커](https://github.com/kwhong/camping-reservation-notifier/issues)
- [Pull Requests](https://github.com/kwhong/camping-reservation-notifier/pulls)

---

**Last Updated**: $(date +%Y-%m-%d)
EOF

# Copy documentation files
echo "📄 Copying documentation files..."
cp ../GETTING_STARTED.md Getting-Started.md
cp ../docs/USER_MANUAL.md User-Manual.md
cp ../docs/OPERATOR_MANUAL.md Operator-Manual.md
cp ../docs/DEPLOYMENT_GUIDE.md Deployment-Guide.md
cp ../docs/EXTERNAL_ACCESS_GUIDE.md External-Access.md
cp ../docs/API_CLIENT_GENERATION.md API-Client-Generation.md
cp ../docs/TESTING_GUIDE.md Testing-Guide.md
cp ../docs/SYSTEM_HEALTH_CHECK.md System-Health-Check.md
cp ../docs/IMPROVEMENT_PLAN.md Improvement-Plan.md
cp ../docs/FINAL_REPORT.md Final-Report.md
cp ../docs/SECURITY_PATCH_v1.0.md Security-Patch.md

# Create API Documentation page with OpenAPI link
echo "📝 Creating API Documentation page..."
cat > API-Documentation.md <<'EOF'
# API Documentation

REST API 문서는 OpenAPI 3.0 명세로 작성되어 있습니다.

## 📄 OpenAPI 명세서

전체 API 명세서는 다음 파일에서 확인할 수 있습니다:

- **파일**: [openapi.yaml](https://github.com/kwhong/camping-reservation-notifier/blob/main/openapi.yaml)
- **형식**: OpenAPI 3.0.3 (Swagger)

## 🌐 온라인 뷰어

### Swagger UI
OpenAPI 명세서를 시각화하여 볼 수 있습니다:

1. https://editor.swagger.io/ 접속
2. "File" → "Import URL"
3. 다음 URL 입력:
   ```
   https://raw.githubusercontent.com/kwhong/camping-reservation-notifier/main/openapi.yaml
   ```

### Redoc
더 깔끔한 문서 스타일을 원한다면:

1. https://redocly.github.io/redoc/ 접속
2. URL에 다음 파라미터 추가:
   ```
   https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/kwhong/camping-reservation-notifier/main/openapi.yaml
   ```

## 📚 API 엔드포인트

### Health Check (인증 불필요)
- `GET /health` - 기본 헬스 체크
- `GET /health/detailed` - 상세 헬스 체크 (메트릭 포함)
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Authentication
- `POST /api/auth/verify` - 토큰 검증 및 사용자 생성
- `PUT /api/auth/profile` - 프로필 업데이트

### Settings (알림 설정)
- `GET /api/settings` - 설정 목록 조회
- `POST /api/settings` - 새 설정 생성
- `PUT /api/settings/:id` - 설정 업데이트
- `DELETE /api/settings/:id` - 설정 삭제

### Availability (예약 현황)
- `GET /api/availability` - 예약 가능 현황 조회

### Logs (로그)
- `GET /api/logs/notifications` - 알림 전송 기록
- `GET /api/logs/scraping` - 스크래핑 실행 기록

## 🔐 인증

모든 `/api/*` 엔드포인트는 Firebase ID Token이 필요합니다:

```
Authorization: Bearer <Firebase_ID_Token>
```

헬스 체크 엔드포인트(`/health*`)는 인증이 필요 없습니다.

## 💻 클라이언트 생성

TypeScript 클라이언트를 자동으로 생성하는 방법은 [API Client Generation](API-Client-Generation) 페이지를 참고하세요.

## 📖 추가 자료

- [Getting Started](Getting-Started) - API 서버 시작하기
- [User Manual](User-Manual) - API 사용 예제
- [GitHub Repository](https://github.com/kwhong/camping-reservation-notifier) - 소스 코드
EOF

# Create Troubleshooting page
echo "📝 Creating Troubleshooting page..."
cat > Troubleshooting.md <<'EOF'
# 문제 해결 (Troubleshooting)

일반적인 문제와 해결 방법을 안내합니다.

## Backend 문제

### 서버가 시작되지 않음

#### 문제: "Cannot find module"
```bash
# 의존성 재설치
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 문제: "Firebase initialization failed"
```bash
# 서비스 계정 파일 확인
ls camping-scraper-prod-firebase-설정.json

# 파일이 없으면 Firebase Console에서 다시 다운로드
```

#### 문제: "Port 3000 already in use"
```bash
# Windows: 포트 사용 중인 프로세스 종료
netstat -ano | findstr :3000
taskkill /F /PID <PID번호>

# 또는 .env에서 포트 변경
PORT=3001
```

### 이메일이 발송되지 않음

#### Gmail App Password 오류
1. 2단계 인증이 활성화되어 있는지 확인
2. 앱 비밀번호를 새로 생성
3. `.env` 파일의 `EMAIL_APP_PASSWORD` 업데이트
4. 서버 재시작

#### Backend 로그 확인
```bash
tail -f backend/logs/combined.log
grep -i "email" backend/logs/combined.log
```

## Frontend 문제

### Backend에 연결되지 않음

#### CORS 오류
- `backend/src/app.js`의 `allowedOrigins` 확인
- Frontend URL이 포함되어 있는지 확인

#### API 호출 실패
```bash
# frontend/.env 확인
cat frontend/.env

# VITE_API_URL이 올바른지 확인
VITE_API_URL=http://localhost:3000/api
```

### Firebase 인증 실패

#### Firebase 설정 확인
- `frontend/src/services/firebase.js` 확인
- Firebase Console에서 apiKey, authDomain 등 확인
- 프로젝트 ID가 일치하는지 확인

## 스크래핑 문제

### Playwright 오류

```bash
cd backend
npm install playwright
npx playwright install chromium
```

### 스크래핑이 실행되지 않음

로그 확인:
```bash
tail -n 50 backend/logs/combined.log | grep -i "scraping"
```

활성 설정 확인:
- 사용자 설정에 미래 날짜가 있는지 확인
- 설정이 활성화(`isActive: true`)되어 있는지 확인

## 추가 도움

더 자세한 정보는 다음 문서를 참고하세요:

- [Getting Started](Getting-Started)
- [User Manual](User-Manual)
- [Operator Manual](Operator-Manual)

문제가 해결되지 않으면 [이슈](https://github.com/kwhong/camping-reservation-notifier/issues)를 등록해주세요.
EOF

# Create FAQ page
echo "📝 Creating FAQ page..."
cat > FAQ.md <<'EOF'
# FAQ (자주 묻는 질문)

## 일반

### Q1: 어떤 캠핑장을 지원하나요?
**A**: 현재는 다리안계곡캠핑장(충북 단양)만 지원합니다. 향후 다른 캠핑장도 추가될 예정입니다.

### Q2: 알림은 몇 번 받나요?
**A**: 각 설정당 최초 1회만 알림이 발송됩니다. 알림 발송 후 해당 설정은 자동으로 비활성화됩니다.

### Q3: 스크래핑 주기는 어떻게 되나요?
**A**: 기본적으로 10분마다 실행되며, 30-120초의 랜덤 딜레이가 추가됩니다.

### Q4: 밤에도 스크래핑하나요?
**A**: 아니요. 한국시간 01:00-08:00 사이에는 스크래핑을 하지 않습니다.

## 설정

### Q5: 여러 개의 알림 설정을 만들 수 있나요?
**A**: 네, 사용자는 원하는 만큼 많은 설정을 만들 수 있습니다.

### Q6: 구역을 선택하지 않으면 어떻게 되나요?
**A**: 모든 구역을 감시합니다. 특정 구역만 원한다면 선택하세요.

### Q7: 알림을 다시 받고 싶어요
**A**: 설정을 다시 활성화하거나 새 설정을 만드세요.

## 기술

### Q8: 이 시스템은 무료인가요?
**A**: 네, 오픈소스 프로젝트입니다. 하지만 Firebase와 서버 운영 비용이 발생할 수 있습니다.

### Q9: 다른 캠핑장을 추가할 수 있나요?
**A**: 가능합니다. `backend/src/services/scraper.service.js` 파일을 수정하여 다른 사이트를 추가할 수 있습니다.

### Q10: 프로덕션 배포는 어떻게 하나요?
**A**: [Deployment Guide](Deployment-Guide)를 참고하세요.

## 문제 해결

### Q11: 이메일이 오지 않아요
**A**: [Troubleshooting](Troubleshooting) 페이지의 "이메일이 발송되지 않음" 섹션을 참고하세요.

### Q12: 서버가 시작되지 않아요
**A**: [Troubleshooting](Troubleshooting) 페이지를 참고하거나 GitHub Issues에 문의하세요.

## 기여

### Q13: 이 프로젝트에 기여하고 싶어요
**A**: 환영합니다! [GitHub 리포지토리](https://github.com/kwhong/camping-reservation-notifier)에서 이슈를 등록하거나 Pull Request를 보내주세요.

### Q14: 버그를 발견했어요
**A**: [GitHub Issues](https://github.com/kwhong/camping-reservation-notifier/issues)에 버그 리포트를 작성해주세요.

---

더 궁금한 점이 있다면 [GitHub Discussions](https://github.com/kwhong/camping-reservation-notifier/discussions)에 질문해주세요.
EOF

# Commit and push
echo "💾 Committing changes..."
git add .
git commit -m "docs: Initial Wiki setup with comprehensive documentation

Added pages:
- Home (with table of contents)
- Getting-Started (5-minute quick start)
- User-Manual (user guide)
- Operator-Manual (operations guide)
- Deployment-Guide (deployment instructions)
- External-Access (Cloudflare Tunnel)
- API-Documentation (OpenAPI spec)
- API-Client-Generation (TypeScript client)
- Testing-Guide (testing procedures)
- System-Health-Check (system inspection)
- Improvement-Plan (Phase 0-6)
- Final-Report (project completion)
- Security-Patch (CVE fixes)
- Troubleshooting (common issues)
- FAQ (frequently asked questions)

Total: 15 comprehensive wiki pages
"

echo "📤 Pushing to GitHub..."
git push origin master

# Cleanup
cd ..
rm -rf wiki-temp

echo "✅ Wiki sync completed successfully!"
echo ""
echo "📝 View your Wiki at:"
echo "   https://github.com/kwhong/camping-reservation-notifier/wiki"
