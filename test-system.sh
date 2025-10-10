#!/bin/bash

###############################################################################
# 캠핑장 예약 알림 시스템 - 전체 시스템 점검 스크립트
###############################################################################
#
# 사용법:
#   ./test-system.sh                  # 전체 테스트 실행
#   ./test-system.sh --quick          # 빠른 테스트 (서버 재시작 없이)
#   ./test-system.sh --backend-only   # Backend만 테스트
#   ./test-system.sh --frontend-only  # Frontend만 테스트
#
###############################################################################

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 옵션 파싱
QUICK_MODE=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

for arg in "$@"; do
  case $arg in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --backend-only)
      BACKEND_ONLY=true
      shift
      ;;
    --frontend-only)
      FRONTEND_ONLY=true
      shift
      ;;
  esac
done

###############################################################################
# 유틸리티 함수
###############################################################################

print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED_TESTS++))
  ((TOTAL_TESTS++))
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
  if command -v $1 &> /dev/null; then
    print_success "$1 is installed"
    return 0
  else
    print_error "$1 is NOT installed"
    return 1
  fi
}

wait_for_server() {
  local url=$1
  local max_attempts=${2:-30}
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if curl -s -f "$url" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
    ((attempt++))
  done
  return 1
}

###############################################################################
# 테스트 함수
###############################################################################

test_prerequisites() {
  print_header "1. 사전 요구사항 확인"

  check_command "node"
  check_command "npm"
  check_command "git"
  check_command "curl"

  # Node.js 버전 확인
  NODE_VERSION=$(node --version)
  print_info "Node.js version: $NODE_VERSION"

  # npm 버전 확인
  NPM_VERSION=$(npm --version)
  print_info "npm version: $NPM_VERSION"
}

test_backend_setup() {
  print_header "2. Backend 설정 확인"

  # .env 파일 확인
  if [ -f "backend/.env" ]; then
    print_success "backend/.env file exists"

    # 필수 환경 변수 확인
    if grep -q "EMAIL_USER" backend/.env && grep -q "EMAIL_APP_PASSWORD" backend/.env; then
      print_success "Required environment variables are set"
    else
      print_error "Missing required environment variables in .env"
    fi
  else
    print_error "backend/.env file NOT found"
  fi

  # Firebase 서비스 계정 파일 확인
  if ls camping-scraper-prod-firebase-*.json 1> /dev/null 2>&1; then
    print_success "Firebase service account file exists"
  else
    print_error "Firebase service account file NOT found"
  fi

  # package.json 확인
  if [ -f "backend/package.json" ]; then
    print_success "backend/package.json exists"
  else
    print_error "backend/package.json NOT found"
  fi

  # node_modules 확인
  if [ -d "backend/node_modules" ]; then
    print_success "backend/node_modules exists"
  else
    print_error "backend/node_modules NOT found (run 'npm install' in backend/)"
  fi
}

test_frontend_setup() {
  print_header "3. Frontend 설정 확인"

  # .env 파일 확인
  if [ -f "frontend/.env" ]; then
    print_success "frontend/.env file exists"
  else
    print_error "frontend/.env file NOT found"
  fi

  # package.json 확인
  if [ -f "frontend/package.json" ]; then
    print_success "frontend/package.json exists"
  else
    print_error "frontend/package.json NOT found"
  fi

  # node_modules 확인
  if [ -d "frontend/node_modules" ]; then
    print_success "frontend/node_modules exists"
  else
    print_error "frontend/node_modules NOT found (run 'npm install' in frontend/)"
  fi
}

test_backend_server() {
  print_header "4. Backend 서버 테스트"

  if [ "$QUICK_MODE" = false ]; then
    print_step "Starting backend server..."

    # 기존 프로세스 종료
    pkill -f "node src/app.js" 2>/dev/null
    sleep 2

    # Backend 시작
    cd backend
    npm start > ../backend-test.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    print_info "Backend PID: $BACKEND_PID"

    # 서버 시작 대기
    print_step "Waiting for backend to start..."
    if wait_for_server "http://localhost:3000/health" 30; then
      print_success "Backend server started successfully"
    else
      print_error "Backend server failed to start"
      cat backend-test.log
      return 1
    fi
  fi

  # Health check 테스트
  print_step "Testing health check endpoint..."
  HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
  if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
    print_success "Health check passed: $HEALTH_RESPONSE"
  else
    print_error "Health check failed"
  fi

  # API 엔드포인트 테스트 (인증 없이 접근 가능한지 확인)
  print_step "Testing API endpoints accessibility..."

  # /api/auth/verify (POST) - 401 응답이 정상
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/verify)
  if [ "$STATUS_CODE" = "401" ]; then
    print_success "API authentication middleware is working (401 Unauthorized)"
  else
    print_error "API authentication issue (expected 401, got $STATUS_CODE)"
  fi

  # 로그 확인
  print_step "Checking backend logs..."
  if [ -f "backend-test.log" ]; then
    if grep -q "🚀 Server is running" backend-test.log; then
      print_success "Server startup message found in logs"
    else
      print_error "Server startup message NOT found in logs"
    fi

    if grep -q "⏰ Scraping scheduler started" backend-test.log; then
      print_success "Scheduler started message found in logs"
    else
      print_error "Scheduler startup message NOT found in logs"
    fi

    # 에러 확인
    if grep -i "error" backend-test.log | grep -v "Error:" | grep -v "errorHandler"; then
      print_error "Errors found in backend logs (see above)"
    else
      print_success "No errors found in backend logs"
    fi
  fi
}

test_frontend_server() {
  print_header "5. Frontend 서버 테스트"

  if [ "$QUICK_MODE" = false ]; then
    print_step "Starting frontend server..."

    # 기존 프로세스 종료
    pkill -f "vite" 2>/dev/null
    sleep 2

    # Frontend 시작
    cd frontend
    npm run dev > ../frontend-test.log 2>&1 &
    FRONTEND_PID=$!
    cd ..

    print_info "Frontend PID: $FRONTEND_PID"

    # 서버 시작 대기
    print_step "Waiting for frontend to start..."
    sleep 5

    # Vite는 포트가 사용 중이면 다른 포트를 사용할 수 있음
    if wait_for_server "http://localhost:5173" 5; then
      FRONTEND_PORT=5173
      print_success "Frontend server started on port 5173"
    elif wait_for_server "http://localhost:5174" 5; then
      FRONTEND_PORT=5174
      print_success "Frontend server started on port 5174"
    else
      print_error "Frontend server failed to start"
      cat frontend-test.log
      return 1
    fi
  else
    # Quick mode: 포트 확인만
    if curl -s -f http://localhost:5173 > /dev/null 2>&1; then
      FRONTEND_PORT=5173
    elif curl -s -f http://localhost:5174 > /dev/null 2>&1; then
      FRONTEND_PORT=5174
    else
      print_error "Frontend server is not running"
      return 1
    fi
  fi

  # Frontend 접근 테스트
  print_step "Testing frontend accessibility..."
  FRONTEND_RESPONSE=$(curl -s http://localhost:$FRONTEND_PORT)
  if echo "$FRONTEND_RESPONSE" | grep -q "<!DOCTYPE html>"; then
    print_success "Frontend is serving HTML"
  else
    print_error "Frontend is NOT serving HTML properly"
  fi

  # React 앱 확인
  if echo "$FRONTEND_RESPONSE" | grep -q "root"; then
    print_success "React root element found"
  else
    print_error "React root element NOT found"
  fi
}

test_integration() {
  print_header "6. 통합 테스트"

  print_step "Testing Frontend → Backend communication..."

  # Backend가 실행 중인지 확인
  if ! curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
    print_error "Backend is not running - skipping integration tests"
    return 1
  fi

  # Frontend가 Backend API를 호출할 수 있는지 확인
  # (브라우저가 아니므로 직접 API 호출)
  print_step "Testing CORS configuration..."
  CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:3000/api/auth/verify)
  if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    print_success "CORS is configured"
  else
    print_error "CORS headers NOT found"
  fi

  print_info "Integration test completed"
}

test_database_connection() {
  print_header "7. Firebase/Firestore 연결 테스트"

  print_step "Checking Firebase initialization..."

  if [ -f "backend-test.log" ]; then
    if grep -q "Firebase initialized successfully" backend-test.log; then
      print_success "Firebase initialized successfully"
    elif grep -q "Firebase" backend-test.log | grep -i "error"; then
      print_error "Firebase initialization error found in logs"
    else
      print_info "Firebase initialization status unclear"
    fi
  else
    print_info "No backend logs available to check Firebase status"
  fi
}

print_summary() {
  print_header "테스트 요약"

  echo ""
  echo "총 테스트: $TOTAL_TESTS"
  echo -e "${GREEN}통과: $PASSED_TESTS${NC}"
  echo -e "${RED}실패: $FAILED_TESTS${NC}"
  echo ""

  if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    echo -e "${GREEN}========================================${NC}"

    if [ "$QUICK_MODE" = false ]; then
      echo ""
      echo "실행 중인 서비스:"
      echo "  - Backend:  http://localhost:3000"
      echo "  - Frontend: http://localhost:${FRONTEND_PORT:-5173}"
      echo ""
      echo "서버를 종료하려면:"
      echo "  pkill -f 'node src/app.js'"
      echo "  pkill -f 'vite'"
    fi

    return 0
  else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ $FAILED_TESTS 개의 테스트 실패${NC}"
    echo -e "${RED}========================================${NC}"

    echo ""
    echo "로그 파일:"
    echo "  - Backend:  backend-test.log"
    echo "  - Frontend: frontend-test.log"

    return 1
  fi
}

###############################################################################
# 메인 실행
###############################################################################

main() {
  echo -e "${BLUE}"
  echo "╔═══════════════════════════════════════════════════╗"
  echo "║  캠핑장 예약 알림 시스템 - 전체 시스템 점검     ║"
  echo "╚═══════════════════════════════════════════════════╝"
  echo -e "${NC}"

  # 옵션 표시
  if [ "$QUICK_MODE" = true ]; then
    print_info "Quick mode: 서버 재시작 없이 테스트"
  fi
  if [ "$BACKEND_ONLY" = true ]; then
    print_info "Backend만 테스트"
  fi
  if [ "$FRONTEND_ONLY" = true ]; then
    print_info "Frontend만 테스트"
  fi

  # 테스트 실행
  test_prerequisites

  if [ "$FRONTEND_ONLY" = false ]; then
    test_backend_setup
    test_backend_server
    test_database_connection
  fi

  if [ "$BACKEND_ONLY" = false ]; then
    test_frontend_setup
    test_frontend_server
  fi

  if [ "$BACKEND_ONLY" = false ] && [ "$FRONTEND_ONLY" = false ]; then
    test_integration
  fi

  # 결과 출력
  print_summary
}

# 스크립트 실행
main
exit $?
