# API 클라이언트 생성 가이드

OpenAPI 명세서(`openapi.yaml`)로부터 타입 안전한 API 클라이언트를 생성하는 방법을 안내합니다.

---

## 문제: openapi-generator-cli 오류

`openapi-generator-cli`를 사용할 때 다음과 같은 오류가 발생합니다:

```
Error: 'java'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```

**원인**: `openapi-generator-cli`는 Java Runtime Environment가 필요합니다.

---

## 해결 방법

### ✅ 방법 1: Java 설치 후 사용

#### 1-1. Java 설치 (Windows)

**winget 사용 (권장):**
```bash
winget install Microsoft.OpenJDK.17
```

**수동 다운로드:**
- Microsoft OpenJDK: https://learn.microsoft.com/ko-kr/java/openjdk/download
- JDK 17 이상 권장

#### 1-2. 설치 확인
```bash
java -version
```

출력 예시:
```
openjdk version "17.0.2" 2022-01-18
OpenJDK Runtime Environment Microsoft-1234567 (build 17.0.2+8)
OpenJDK 64-Bit Server VM Microsoft-1234567 (build 17.0.2+8, mixed mode)
```

#### 1-3. 클라이언트 생성
```bash
# TypeScript + axios 클라이언트
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./frontend/src/generated-api

# JavaScript 클라이언트
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g javascript \
  -o ./frontend/src/generated-api
```

---

### ✅ 방법 2: Java 없이 대안 도구 사용 (권장)

#### 2-1. swagger-typescript-api (추천)

**특징:**
- ✅ Java 불필요
- ✅ axios 기반 완전한 클라이언트 생성
- ✅ TypeScript 타입 지원
- ✅ 간단한 사용법

**설치:**
```bash
npm install -D swagger-typescript-api
```

**클라이언트 생성:**
```bash
# 프로젝트 루트에서 실행
npx swagger-typescript-api \
  -p openapi.yaml \
  -o ./frontend/src/api \
  -n camping-api.ts \
  --axios
```

**생성된 파일:**
- `frontend/src/api/camping-api.ts` - API 클라이언트 클래스
- `frontend/src/api/data-contracts.ts` - TypeScript 타입 정의

**사용 예제:**
```typescript
import { Api } from './api/camping-api';

const api = new Api({
  baseURL: 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${firebaseToken}`
  }
});

// 사용자 설정 조회
const settings = await api.api.getUserSettings();

// 새 설정 생성
const newSetting = await api.api.createUserSetting({
  dateFrom: '2025-11-01',
  dateTo: '2025-11-30',
  area: ['A구역']
});
```

---

#### 2-2. openapi-typescript

**특징:**
- ✅ Java 불필요
- ✅ 타입 정의만 생성 (클라이언트 코드는 직접 작성)
- ✅ 매우 가볍고 빠름

**설치:**
```bash
npm install -D openapi-typescript
```

**타입 생성:**
```bash
npx openapi-typescript openapi.yaml -o ./frontend/src/types/api.ts
```

**사용 예제:**
```typescript
import type { paths } from './types/api';

type SettingsResponse = paths['/api/settings']['get']['responses']['200']['content']['application/json'];

// 직접 axios 사용
const response = await axios.get<SettingsResponse>('/api/settings');
```

---

#### 2-3. orval (React Query 사용 시)

**특징:**
- ✅ Java 불필요
- ✅ React Query hooks 자동 생성
- ✅ MSW mocking 지원
- ✅ Zod 스키마 생성 가능

**설치:**
```bash
npm install -D orval
```

**설정 파일 생성** (`orval.config.js`):
```javascript
module.exports = {
  'camping-api': {
    input: './openapi.yaml',
    output: {
      mode: 'tags-split',
      target: './frontend/src/api/generated',
      schemas: './frontend/src/api/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './frontend/src/api/axios-instance.ts',
          name: 'customInstance'
        }
      }
    }
  }
};
```

**axios 인스턴스 생성** (`frontend/src/api/axios-instance.ts`):
```typescript
import Axios, { AxiosRequestConfig } from 'axios';
import { getAuth } from 'firebase/auth';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Firebase 토큰 자동 추가
AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const customInstance = <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  return AXIOS_INSTANCE(config).then(({ data }) => data);
};
```

**클라이언트 생성:**
```bash
npx orval
```

**사용 예제:**
```typescript
import { useGetUserSettings } from './api/generated/settings';

function SettingsPage() {
  const { data, isLoading } = useGetUserSettings();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.map(setting => (
        <div key={setting.id}>{setting.campingName}</div>
      ))}
    </div>
  );
}
```

---

## 비교표

| 도구 | Java 필요 | 타입 생성 | 클라이언트 코드 | React Query | MSW Mock |
|------|-----------|-----------|----------------|-------------|----------|
| **openapi-generator-cli** | ✅ 필요 | ✅ | ✅ | ❌ | ❌ |
| **swagger-typescript-api** | ❌ | ✅ | ✅ (axios) | ❌ | ❌ |
| **openapi-typescript** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **orval** | ❌ | ✅ | ✅ (axios) | ✅ | ✅ |

---

## 권장 사항

### 프로젝트에 따른 추천:

#### 1️⃣ **React + React Query 프로젝트**
→ **orval** 사용
- React Query hooks 자동 생성
- MSW로 API mocking 가능
- 최고의 개발자 경험

#### 2️⃣ **React + 일반 axios 프로젝트**
→ **swagger-typescript-api** 사용
- 간단하고 빠름
- axios 기반 완전한 클라이언트
- Java 불필요

#### 3️⃣ **타입만 필요한 경우**
→ **openapi-typescript** 사용
- 가장 가벼움
- 기존 API 클라이언트에 타입 추가

#### 4️⃣ **다양한 언어 지원 필요**
→ **openapi-generator-cli** 사용
- Java 설치 필요
- Python, Go, Swift 등 다양한 언어

---

## 실제 적용 예시 (swagger-typescript-api)

### 1. 설치 및 생성
```bash
cd frontend
npm install -D swagger-typescript-api
npx swagger-typescript-api -p ../openapi.yaml -o ./src/api -n api.ts --axios
```

### 2. API 클라이언트 래퍼 생성
**`frontend/src/services/api-client.ts`:**
```typescript
import { Api } from '../api/api';
import { getAuth } from 'firebase/auth';

class ApiClient {
  private api: Api<unknown>;

  constructor() {
    this.api = new Api({
      baseURL: import.meta.env.VITE_API_URL
    });

    // 인터셉터로 Firebase 토큰 자동 추가
    this.api.instance.interceptors.request.use(async (config) => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }

      return config;
    });
  }

  // Settings API
  async getSettings() {
    const response = await this.api.api.getUserSettings();
    return response.data;
  }

  async createSetting(data: {
    dateFrom: string;
    dateTo: string;
    area?: string[];
  }) {
    const response = await this.api.api.createUserSetting(data);
    return response.data;
  }

  async updateSetting(id: string, data: any) {
    const response = await this.api.api.updateUserSetting(id, data);
    return response.data;
  }

  async deleteSetting(id: string) {
    const response = await this.api.api.deleteUserSetting(id);
    return response.data;
  }

  // Availability API
  async getAvailability() {
    const response = await this.api.api.getAvailability();
    return response.data;
  }

  // Logs API
  async getNotificationLogs(limit?: number) {
    const response = await this.api.api.getNotificationLogs({ limit });
    return response.data;
  }

  async getScrapingLogs(limit?: number) {
    const response = await this.api.api.getScrapingLogs({ limit });
    return response.data;
  }

  // Health API
  async getHealth() {
    const response = await this.api.health.getHealth();
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 3. React 컴포넌트에서 사용
```typescript
import { useEffect, useState } from 'react';
import { apiClient } from '../services/api-client';
import type { UserSetting } from '../api/data-contracts';

function SettingsPage() {
  const [settings, setSettings] = useState<UserSetting[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await apiClient.getSettings();
    setSettings(data.data);
  };

  const handleCreate = async () => {
    await apiClient.createSetting({
      dateFrom: '2025-11-01',
      dateTo: '2025-11-30',
      area: ['A구역']
    });
    loadSettings();
  };

  return (
    <div>
      <button onClick={handleCreate}>새 설정 추가</button>
      {settings.map(setting => (
        <div key={setting.id}>{setting.campingName}</div>
      ))}
    </div>
  );
}
```

---

## 문제 해결

### Q1: "Cannot find module 'axios'" 오류
```bash
npm install axios
```

### Q2: 생성된 타입이 맞지 않음
```bash
# openapi.yaml 검증
npx @apidevtools/swagger-cli validate openapi.yaml

# 캐시 삭제 후 재생성
rm -rf frontend/src/api
npx swagger-typescript-api -p openapi.yaml -o frontend/src/api -n api.ts --axios
```

### Q3: baseURL 환경변수 설정
**`.env.development`:**
```
VITE_API_URL=http://localhost:3000
```

**`.env.production`:**
```
VITE_API_URL=https://your-production-domain.com
```

---

## 참고 자료

- swagger-typescript-api: https://github.com/acacode/swagger-typescript-api
- openapi-typescript: https://github.com/drwpow/openapi-typescript
- orval: https://orval.dev/
- OpenAPI Generator: https://openapi-generator.tech/
