# ADR-002: ES Modules 사용

## 상태
채택됨 (Accepted)

## 컨텍스트
Node.js 백엔드 프로젝트에서 모듈 시스템을 선택해야 했습니다. Node.js는 CommonJS(CJS)와 ES Modules(ESM) 두 가지 모듈 시스템을 지원합니다.

### 요구사항
- 최신 JavaScript 표준 준수
- 프론트엔드(React)와 일관된 문법
- Tree-shaking 가능성
- 비동기 모듈 로딩 지원

### 고려한 옵션

#### 옵션 1: CommonJS (require/module.exports)
```javascript
const express = require('express');
const { ScraperService } = require('./services/scraper.service');

module.exports = { startServer };
```
- **장점:**
  - Node.js 전통적인 기본 모듈 시스템
  - 모든 npm 패키지와 호환
  - 동기적 로딩으로 단순함
- **단점:**
  - 레거시 표준 (ECMAScript 표준 아님)
  - Tree-shaking 지원 제한적
  - Top-level await 불가능
  - 프론트엔드와 문법 불일치

#### 옵션 2: ES Modules (import/export)
```javascript
import express from 'express';
import { ScraperService } from './services/scraper.service.js';

export { startServer };
```
- **장점:**
  - ECMAScript 표준 (ES6+)
  - Tree-shaking 지원 (번들러 최적화)
  - Top-level await 지원
  - 프론트엔드 React와 동일한 문법
  - 정적 분석 가능 (IDE 지원 향상)
- **단점:**
  - 일부 오래된 npm 패키지 호환성 문제 가능
  - 파일 확장자(.js) 명시 필요
  - Node.js 12+ 이상 필요

## 결정
**ES Modules (ESM)**를 표준 모듈 시스템으로 사용합니다.

### 구성 방법
`package.json`에 `"type": "module"` 추가:
```json
{
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 결정 근거
1. **최신 표준 준수**: ES Modules는 ECMAScript 표준이며, JavaScript의 미래 방향입니다.

2. **프론트엔드와 일관성**: React 프론트엔드에서 이미 `import/export` 문법을 사용하고 있어, 백엔드도 동일한 문법을 사용하면 개발자 경험이 향상됩니다.

3. **Top-level await 활용**: 스케줄러 초기화와 Firebase 연결 시 top-level await를 사용하여 코드를 간결하게 작성할 수 있습니다.
   ```javascript
   // app.js에서 바로 사용 가능
   import { initializeApp } from 'firebase-admin/app';
   await someAsyncInitialization();
   ```

4. **정적 분석 및 IDE 지원**: ESM은 정적으로 분석 가능하여 VSCode 등의 IDE에서 더 나은 자동완성과 리팩토링 지원을 받을 수 있습니다.

5. **Node.js 18+ 사용**: 프로젝트는 Node.js 18.x 이상을 요구하므로 ESM이 안정적으로 지원됩니다.

## 결과
### 긍정적 영향
- **일관된 코드베이스**: 프론트엔드와 백엔드가 동일한 모듈 문법 사용
- **향상된 IDE 지원**: import 자동완성, 사용하지 않는 import 감지 등
- **미래 호환성**: JavaScript의 표준 방향과 일치
- **간결한 비동기 코드**: Top-level await로 초기화 코드 단순화

### 발생한 문제와 해결
1. **파일 확장자 필수**
   - 문제: ESM에서는 상대 경로 import 시 `.js` 확장자 명시 필수
   - 해결: 모든 로컬 import에 `.js` 확장자 추가
   ```javascript
   // ✅ 올바른 방법
   import { ScraperService } from './services/scraper.service.js';

   // ❌ 작동하지 않음
   import { ScraperService } from './services/scraper.service';
   ```

2. **__dirname 사용 불가**
   - 문제: CommonJS의 `__dirname`이 ESM에서 기본 제공되지 않음
   - 해결: `import.meta.url`과 `fileURLToPath` 사용
   ```javascript
   import { fileURLToPath } from 'url';
   import { dirname, join } from 'path';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   ```

3. **JSON 파일 import**
   - 문제: ESM에서 JSON import 시 실험적 기능 플래그 필요
   - 해결: `fs.readFileSync`와 `JSON.parse` 사용
   ```javascript
   import { readFileSync } from 'fs';
   const config = JSON.parse(readFileSync('./config.json', 'utf-8'));
   ```

### 적용 패턴
```javascript
// ✅ Named exports 선호 (Tree-shaking 최적화)
export class ScraperService { }
export const helperFunction = () => { };

// ✅ Default export는 주요 클래스/함수에만 사용
export default class NotificationService { }

// ✅ Re-export로 공개 API 정의
export { ScraperService } from './services/scraper.service.js';
export { NotificationService } from './services/notification.service.js';
```

## 대안 고려사항
향후 TypeScript 도입 시 ESM과 완벽하게 호환되므로 마이그레이션이 용이합니다.

## 관련 결정
- [ADR-001: Express.js 선택](ADR-001-backend-framework-selection.md)
- [ADR-005: Node.js 18+ 사용](ADR-005-nodejs-version.md)

## 참고자료
- [Node.js ES Modules 공식 문서](https://nodejs.org/api/esm.html)
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

---
**작성일**: 2024-01-15
**작성자**: Development Team
**최종 검토**: 2024-01-15
