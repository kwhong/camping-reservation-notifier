# GitHub Wiki 설정 가이드

GitHub Wiki에 문서를 등록하는 방법을 안내합니다.

---

## Wiki 활성화

### 1. GitHub에서 Wiki 기능 활성화

1. 리포지토리 페이지 접속: https://github.com/kwhong/camping-reservation-notifier
2. **Settings** 탭 클릭
3. **Features** 섹션에서 **Wikis** 체크박스 활성화
4. **Save** 클릭

### 2. 첫 페이지 생성 (웹 UI)

1. 리포지토리 상단 메뉴에서 **Wiki** 탭 클릭
2. **Create the first page** 버튼 클릭
3. 다음 내용 입력:
   - **Title**: `Home`
   - **Content**:
     ```markdown
     # Camping Reservation Notifier Wiki

     캠핑장 예약 알림 시스템의 공식 위키입니다.

     ## 📚 문서 목차

     ### 시작하기
     - **[Getting Started](Getting-Started)** - 5분 빠른 시작 가이드

     ### 사용자 가이드
     - [사용자 매뉴얼](User-Manual) - 시스템 사용법
     - [외부 접속 설정](External-Access) - Cloudflare Tunnel

     ### 운영자 가이드
     - [운영자 매뉴얼](Operator-Manual) - 시스템 운영
     - [배포 가이드](Deployment-Guide) - 프로덕션 배포

     ### 개발자 가이드
     - [API 문서](API-Documentation) - REST API 명세
     - [API 클라이언트 생성](API-Client-Generation) - TypeScript 클라이언트

     ### 참고 자료
     - [GitHub 리포지토리](https://github.com/kwhong/camping-reservation-notifier)
     - [이슈 트래커](https://github.com/kwhong/camping-reservation-notifier/issues)
     ```
4. **Save Page** 클릭

---

## Wiki에 문서 추가하기

### 방법 1: 웹 UI 사용 (간단)

#### Getting Started 페이지 추가

1. Wiki 탭 → **New Page** 버튼 클릭
2. **Title**: `Getting Started`
3. **Content**: `GETTING_STARTED.md` 파일 내용 복사 붙여넣기
4. **Save Page** 클릭

#### 추가 페이지 생성

다음 페이지들도 동일한 방법으로 생성:

| Page Title | 소스 파일 |
|-----------|---------|
| `User Manual` | `docs/USER_MANUAL.md` |
| `Operator Manual` | `docs/OPERATOR_MANUAL.md` |
| `Deployment Guide` | `docs/DEPLOYMENT_GUIDE.md` |
| `External Access` | `docs/EXTERNAL_ACCESS_GUIDE.md` |
| `API Documentation` | `openapi.yaml` (Swagger 링크 추가) |
| `API Client Generation` | `docs/API_CLIENT_GENERATION.md` |

---

### 방법 2: Git으로 관리 (고급)

Wiki가 활성화된 후 Git으로 관리 가능:

#### 1. Wiki 저장소 클론

```bash
cd /tmp
git clone https://github.com/kwhong/camping-reservation-notifier.wiki.git
cd camping-reservation-notifier.wiki
```

#### 2. 문서 추가

```bash
# Getting Started 페이지 추가
cp /path/to/GETTING_STARTED.md Getting-Started.md

# 다른 페이지들 추가
cp /path/to/docs/USER_MANUAL.md User-Manual.md
cp /path/to/docs/OPERATOR_MANUAL.md Operator-Manual.md
cp /path/to/docs/DEPLOYMENT_GUIDE.md Deployment-Guide.md
```

**중요**: Wiki 파일명은 공백 대신 하이픈(`-`)을 사용해야 합니다.

#### 3. 커밋 및 푸시

```bash
git add .
git commit -m "docs: Add Getting Started and other guides to Wiki"
git push origin master
```

---

## Wiki 문서 작성 팁

### 파일명 규칙

- **공백 제거**: `Getting Started` → `Getting-Started.md`
- **Home 페이지**: `Home.md` (필수)
- **대소문자**: 파일명은 대소문자를 구분합니다

### 내부 링크

Wiki 페이지 간 링크:

```markdown
# 절대 링크
[Getting Started](Getting-Started)

# 섹션 링크
[시스템 요구사항](Getting-Started#시스템-요구사항)

# 외부 링크
[GitHub 리포지토리](https://github.com/kwhong/camping-reservation-notifier)
```

### 이미지 추가

Wiki에 이미지를 업로드하려면:

1. Wiki 페이지 편집 모드
2. 이미지를 드래그 앤 드롭
3. 자동으로 GitHub에 업로드되고 마크다운 생성됨

또는 이슈/PR에 이미지 업로드 후 URL 복사:

```markdown
![Screenshot](https://user-images.githubusercontent.com/...)
```

---

## 추천 Wiki 구조

### Home.md (메인 페이지)

```markdown
# Camping Reservation Notifier Wiki

## 빠른 시작
- [Getting Started](Getting-Started) ⭐

## 사용자 문서
- [사용자 매뉴얼](User-Manual)
- [외부 접속 설정](External-Access)

## 운영자 문서
- [운영자 매뉴얼](Operator-Manual)
- [배포 가이드](Deployment-Guide)
- [테스트 가이드](Testing-Guide)

## 개발자 문서
- [API 문서](API-Documentation)
- [API 클라이언트 생성](API-Client-Generation)
- [시스템 헬스 체크](System-Health-Check)

## 개선 프로젝트
- [개선 계획](Improvement-Plan)
- [최종 리포트](Final-Report)

## 참고
- [FAQ](FAQ)
- [문제 해결](Troubleshooting)
```

### Getting-Started.md

`GETTING_STARTED.md` 전체 내용 복사

### User-Manual.md

`docs/USER_MANUAL.md` 전체 내용 복사

---

## 자동화 스크립트

Wiki 페이지를 자동으로 생성하는 스크립트:

```bash
#!/bin/bash
# sync-wiki.sh

# Wiki 저장소 클론
git clone https://github.com/kwhong/camping-reservation-notifier.wiki.git wiki-temp
cd wiki-temp

# 문서 복사
cp ../GETTING_STARTED.md Getting-Started.md
cp ../README.md Home.md
cp ../docs/USER_MANUAL.md User-Manual.md
cp ../docs/OPERATOR_MANUAL.md Operator-Manual.md
cp ../docs/DEPLOYMENT_GUIDE.md Deployment-Guide.md
cp ../docs/EXTERNAL_ACCESS_GUIDE.md External-Access.md
cp ../docs/API_CLIENT_GENERATION.md API-Client-Generation.md
cp ../docs/TESTING_GUIDE.md Testing-Guide.md
cp ../docs/SYSTEM_HEALTH_CHECK.md System-Health-Check.md
cp ../docs/IMPROVEMENT_PLAN.md Improvement-Plan.md
cp ../docs/FINAL_REPORT.md Final-Report.md

# 커밋 및 푸시
git add .
git commit -m "docs: Sync documentation to Wiki"
git push origin master

# 정리
cd ..
rm -rf wiki-temp
```

**사용법:**
```bash
chmod +x sync-wiki.sh
./sync-wiki.sh
```

---

## FAQ

### Q1: Wiki가 보이지 않아요
**A**: Settings → Features → Wikis 체크박스가 활성화되어 있는지 확인하세요.

### Q2: Wiki를 비공개로 만들 수 있나요?
**A**: Wiki는 리포지토리의 공개/비공개 설정을 따릅니다. 프라이빗 리포지토리면 Wiki도 비공개입니다.

### Q3: Wiki 편집 권한은?
**A**: 기본적으로 리포지토리에 쓰기 권한이 있는 사용자만 편집 가능합니다. Settings에서 "Restrict editing to collaborators only" 해제 시 모든 GitHub 사용자가 편집 가능합니다.

### Q4: Wiki 검색이 안돼요
**A**: GitHub의 전체 검색에서 Wiki 컨텐츠도 검색됩니다. 또는 Wiki 페이지 내 검색 기능을 사용하세요.

---

## 유용한 링크

- **GitHub Wiki 공식 문서**: https://docs.github.com/en/communities/documenting-your-project-with-wikis
- **Markdown 가이드**: https://guides.github.com/features/mastering-markdown/
- **Wiki Git 클론**: `git clone https://github.com/<username>/<repo>.wiki.git`

---

## 다음 단계

1. ✅ Settings에서 Wiki 활성화
2. ✅ Home 페이지 생성
3. ✅ Getting Started 페이지 추가
4. ✅ 추가 문서 페이지 생성
5. ✅ 내부 링크 연결
6. ✅ 이미지 및 스크린샷 추가 (선택)

Wiki가 준비되면 README.md에 Wiki 링크를 추가하세요:

```markdown
## 📚 문서

자세한 문서는 [Wiki](https://github.com/kwhong/camping-reservation-notifier/wiki)를 참고하세요.
```
