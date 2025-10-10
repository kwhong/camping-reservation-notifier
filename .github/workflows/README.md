# GitHub Actions Workflows

이 디렉토리는 GitHub Actions 워크플로우를 포함하고 있습니다.

## 📋 워크플로우 목록

### 1. `ci.yml` - CI/CD 빌드 및 테스트

**트리거:**
- `main` 브랜치에 push할 때
- Pull Request가 생성/업데이트될 때

**실행 내용:**
- ✅ Backend 빌드 및 테스트 (Node.js 18.x, 20.x)
- ✅ Frontend 빌드 및 테스트 (Node.js 18.x, 20.x)
- ✅ 코드 품질 검사 (환경변수 파일 체크 등)
- ✅ 빌드 아티팩트 생성 (Frontend dist 파일)

**확인 방법:**
- GitHub 레포지토리 → "Actions" 탭에서 워크플로우 실행 결과 확인
- PR에 자동으로 상태 체크 표시

### 2. `deploy.yml.example` - 배포 워크플로우 예시

**사용 방법:**
1. `deploy.yml.example` 파일을 `deploy.yml`로 이름 변경
2. GitHub Secrets 설정:
   - Repository → Settings → Secrets and variables → Actions
   - 다음 시크릿 추가:
     - `SERVER_HOST`: 서버 IP 또는 도메인
     - `SERVER_USER`: SSH 사용자명
     - `SSH_PRIVATE_KEY`: SSH 개인키

3. 파일 내 경로 수정:
   ```yaml
   cd /path/to/camping-reservation-notifier  # 실제 서버 경로로 변경
   ```

4. 커밋 후 GitHub에 푸시하면 자동 배포 시작

## 🚀 워크플로우 실행 확인

### GitHub Actions 탭에서 확인
```
https://github.com/kwhong/camping-reservation-notifier/actions
```

### 배지 추가 (선택사항)
README.md에 다음을 추가하여 빌드 상태 표시:

```markdown
![CI](https://github.com/kwhong/camping-reservation-notifier/workflows/CI%20-%20Build%20and%20Test/badge.svg)
```

## 📌 참고사항

### CI 워크플로우
- **자동 실행**: 코드 푸시/PR 생성시 자동 실행
- **빌드 캐싱**: npm 패키지 캐싱으로 빌드 시간 단축
- **멀티 버전 테스트**: Node.js 18, 20 버전 모두에서 테스트
- **아티팩트 보관**: 빌드된 파일 7일간 보관

### 배포 워크플로우
- **수동 실행 가능**: Actions 탭에서 "Run workflow" 버튼으로 수동 실행 가능
- **보안**: SSH 키는 절대 코드에 포함하지 말고 GitHub Secrets 사용
- **롤백**: 배포 실패시 서버에서 수동으로 이전 버전으로 복구 필요

## 🔧 트러블슈팅

### 빌드 실패시
1. Actions 탭에서 로그 확인
2. 로컬에서 `npm install && npm run build` 테스트
3. Node.js 버전 확인 (18.x 이상 권장)

### 배포 실패시
1. SSH 연결 확인: `ssh user@server`
2. GitHub Secrets 설정 확인
3. 서버 경로 및 권한 확인
4. PM2 상태 확인: `pm2 status`

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Node.js 액션](https://github.com/actions/setup-node)
- [SSH 배포 액션](https://github.com/appleboy/ssh-action)
