## Classes

<dl>
<dt><a href="#HealthService">HealthService</a></dt>
<dd><p>Health Check Service</p>
</dd>
<dt><a href="#NotificationService">NotificationService</a></dt>
<dd><p>알림 서비스</p>
</dd>
<dt><a href="#ScraperService">ScraperService</a></dt>
<dd><p>캠핑장 스크래핑 서비스</p>
</dd>
<dt><a href="#AppError">AppError</a></dt>
<dd><p>Base Application Error</p>
</dd>
<dt><a href="#AuthenticationError">AuthenticationError</a></dt>
<dd><p>Authentication Errors</p>
</dd>
<dt><a href="#DatabaseError">DatabaseError</a></dt>
<dd><p>Database Errors</p>
</dd>
<dt><a href="#ScraperError">ScraperError</a></dt>
<dd><p>Scraper Errors</p>
</dd>
<dt><a href="#EmailError">EmailError</a></dt>
<dd><p>Email Errors</p>
</dd>
<dt><a href="#ValidationError">ValidationError</a></dt>
<dd><p>Validation Errors</p>
</dd>
<dt><a href="#RateLimitError">RateLimitError</a></dt>
<dd><p>Rate Limit Error</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#config">config</a></dt>
<dd><p>Centralized Configuration</p>
</dd>
<dt><a href="#errorHandler">errorHandler</a></dt>
<dd><p>Global error handler middleware</p>
</dd>
<dt><a href="#notFoundHandler">notFoundHandler</a></dt>
<dd><p>Handle 404 errors</p>
</dd>
<dt><a href="#asyncHandler">asyncHandler</a></dt>
<dd><p>Async handler wrapper to catch errors in async route handlers</p>
</dd>
<dt><a href="#requestIdMiddleware">requestIdMiddleware</a></dt>
<dd><p>Add unique request ID to each request for tracing</p>
</dd>
<dt><a href="#logRequestMiddleware">logRequestMiddleware</a></dt>
<dd><p>Add request ID to logger context</p>
</dd>
<dt><a href="#getKoreaDate">getKoreaDate</a></dt>
<dd><p>Get current date in Korea timezone (KST: UTC+9)</p>
</dd>
<dt><a href="#getKoreaHour">getKoreaHour</a></dt>
<dd><p>Get current hour in Korea timezone (0-23)</p>
</dd>
<dt><a href="#isSleepTime">isSleepTime</a></dt>
<dd><p>Check if current time is in sleep period (01:00 - 08:00 KST)</p>
</dd>
<dt><a href="#formatDate">formatDate</a></dt>
<dd><p>Format date to YYYY-MM-DD</p>
</dd>
<dt><a href="#formatYearMonth">formatYearMonth</a></dt>
<dd><p>Format date to YYYY-MM (for URL parameter)</p>
</dd>
<dt><a href="#getMonthsToScrape">getMonthsToScrape</a></dt>
<dd><p>Get array of months to scrape [current, next, next+1]</p>
</dd>
<dt><a href="#getMonthsFromSettings">getMonthsFromSettings</a> ⇒ <code>Array</code></dt>
<dd><p>Get unique months from active user settings</p>
</dd>
<dt><a href="#getRandomDelay">getRandomDelay</a></dt>
<dd><p>Get random delay between min and max seconds</p>
</dd>
<dt><a href="#ERROR_CODES">ERROR_CODES</a></dt>
<dd><p>Error Code Reference</p>
</dd>
<dt><a href="#retryStrategies">retryStrategies</a></dt>
<dd><p>Retry specific operations with predefined strategies</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#validateConfig">validateConfig()</a></dt>
<dd><p>Validate required configuration</p>
</dd>
<dt><a href="#matchesSetting">matchesSetting(item, setting)</a> ⇒ <code>boolean</code></dt>
<dd><p>캠핑장명, 지역, 구역(OR), 날짜 범위 조건 검증</p>
</dd>
<dt><a href="#startScheduler">startScheduler()</a></dt>
<dd><ul>
<li>10분마다 실행되는 Cron 작업 등록</li>
<li>실행 전 30-120초 랜덤 딜레이 추가 (서버 부하 분산)</li>
<li>수면 시간(01:00-08:00 KST) 체크하여 스킵</li>
<li>활성 설정이 있고 미래 날짜가 있을 때만 스크래핑 실행</li>
</ul>
</dd>
<dt><a href="#stopScheduler">stopScheduler()</a></dt>
<dd><p>실행 중인 Cron 작업을 중지하고 null로 초기화</p>
</dd>
<dt><a href="#checkForActiveSettings">checkForActiveSettings()</a> ⇒ <code>Promise.&lt;boolean&gt;</code></dt>
<dd><ul>
<li>모든 활성 사용자 설정 조회</li>
<li>각 설정의 dateFrom 또는 dateTo가 오늘 이후인지 확인</li>
<li>날짜가 지정되지 않은 설정도 활성으로 간주</li>
</ul>
</dd>
<dt><a href="#executeScraping">executeScraping()</a> ⇒ <code>Promise.&lt;void&gt;</code></dt>
<dd><ul>
<li>활성 설정 기반으로 스크래핑 실행</li>
<li>스크래핑된 항목 수 로깅</li>
<li>최신 예약 가능 현황 조회</li>
<li>사용자 설정과 매칭하여 알림 발송</li>
</ul>
</dd>
<dt><a href="#runScrapingNow">runScrapingNow()</a> ⇒ <code>Promise.&lt;void&gt;</code></dt>
<dd><p>스케줄러 대기 없이 즉시 스크래핑 실행 (개발/테스트 용도)</p>
</dd>
<dt><a href="#isOperationalError">isOperationalError()</a></dt>
<dd><p>Check if error is operational (expected)</p>
</dd>
<dt><a href="#formatErrorResponse">formatErrorResponse()</a></dt>
<dd><p>Format error for API response</p>
</dd>
<dt><a href="#retryWithBackoff">retryWithBackoff(fn, options)</a> ⇒ <code>Promise</code></dt>
<dd><p>Retry a function with exponential backoff</p>
</dd>
<dt><a href="#retryWithFixedDelay">retryWithFixedDelay(fn, options)</a> ⇒ <code>Promise</code></dt>
<dd><p>Retry a function with fixed delay</p>
</dd>
<dt><a href="#sleep">sleep(ms)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sleep utility</p>
</dd>
<dt><a href="#isRetryableError">isRetryableError(error)</a> ⇒ <code>boolean</code></dt>
<dd><p>Check if error is retryable</p>
</dd>
<dt><a href="#retryIfRetryable">retryIfRetryable(fn, options)</a> ⇒ <code>Promise</code></dt>
<dd><p>Retry only if error is retryable</p>
</dd>
</dl>

<a name="HealthService"></a>

## HealthService
Health Check Service

**Kind**: global class  

* [HealthService](#HealthService)
    * [.checkHealth()](#HealthService+checkHealth)
    * [.checkFirestore()](#HealthService+checkFirestore)
    * [.checkAuth()](#HealthService+checkAuth)
    * [.checkEmail()](#HealthService+checkEmail)
    * [.checkScheduler()](#HealthService+checkScheduler)
    * [.getMemoryUsage()](#HealthService+getMemoryUsage)
    * [.getLastScrapingStatus()](#HealthService+getLastScrapingStatus)
    * [.getMetrics()](#HealthService+getMetrics)

<a name="HealthService+checkHealth"></a>

### healthService.checkHealth()
Check overall system health

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+checkFirestore"></a>

### healthService.checkFirestore()
Check Firestore connection

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+checkAuth"></a>

### healthService.checkAuth()
Check Firebase Auth

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+checkEmail"></a>

### healthService.checkEmail()
Check Email service

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+checkScheduler"></a>

### healthService.checkScheduler()
Check Scheduler status

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+getMemoryUsage"></a>

### healthService.getMemoryUsage()
Get memory usage

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+getLastScrapingStatus"></a>

### healthService.getLastScrapingStatus()
Get last scraping status

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="HealthService+getMetrics"></a>

### healthService.getMetrics()
Get system metrics

**Kind**: instance method of [<code>HealthService</code>](#HealthService)  
<a name="NotificationService"></a>

## NotificationService
알림 서비스

**Kind**: global class  

* [NotificationService](#NotificationService)
    * [new exports.NotificationService()](#new_NotificationService_new)
    * [.checkAndNotify(newAvailability)](#NotificationService+checkAndNotify) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.matchesCriteria(availabilityList, setting)](#NotificationService+matchesCriteria) ⇒ <code>Array</code>
    * [.sendNotifications(setting, matches)](#NotificationService+sendNotifications) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.sendEmailNotification(userId, setting, match)](#NotificationService+sendEmailNotification) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.hasSettingNotified(settingId)](#NotificationService+hasSettingNotified) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="new_NotificationService_new"></a>

### new exports.NotificationService()
캠핑장 예약 가능 시 사용자에게 이메일 알림을 발송하는 서비스

<a name="NotificationService+checkAndNotify"></a>

### notificationService.checkAndNotify(newAvailability) ⇒ <code>Promise.&lt;void&gt;</code>
- 모든 활성 사용자 설정을 조회
- 각 설정의 조건(캠핑장, 지역, 구역, 날짜)과 매칭
- 조건 일치 시 이메일 알림 발송 및 설정 비활성화

**Kind**: instance method of [<code>NotificationService</code>](#NotificationService)  

| Param | Type | Description |
| --- | --- | --- |
| newAvailability | <code>Array</code> | 스크래핑된 예약 가능 현황 배열 |

<a name="NotificationService+matchesCriteria"></a>

### notificationService.matchesCriteria(availabilityList, setting) ⇒ <code>Array</code>
- 캠핑장명, 지역, 구역(OR 조건), 날짜 범위 확인
- availableCount > 0인 항목만 반환

**Kind**: instance method of [<code>NotificationService</code>](#NotificationService)  
**Returns**: <code>Array</code> - 조건에 일치하는 예약 가능 항목 배열  

| Param | Type | Description |
| --- | --- | --- |
| availabilityList | <code>Array</code> | 예약 가능 현황 목록 |
| setting | <code>Object</code> | 사용자 설정 객체 |

<a name="NotificationService+sendNotifications"></a>

### notificationService.sendNotifications(setting, matches) ⇒ <code>Promise.&lt;void&gt;</code>
- 이미 알림을 발송한 설정인지 확인 (중복 방지)
- 첫 번째 매칭 항목에 대해 이메일 알림 발송
- Firestore에 알림 기록 저장
- 알림 발송 후 설정을 자동으로 비활성화 (1회성 알림)

**Kind**: instance method of [<code>NotificationService</code>](#NotificationService)  

| Param | Type | Description |
| --- | --- | --- |
| setting | <code>Object</code> | 사용자 설정 객체 |
| matches | <code>Array</code> | 조건에 일치하는 예약 가능 항목 배열 |

<a name="NotificationService+sendEmailNotification"></a>

### notificationService.sendEmailNotification(userId, setting, match) ⇒ <code>Promise.&lt;void&gt;</code>
- Firestore에서 사용자 정보 조회 (notificationEmail 우선, 없으면 email 사용)
- HTML 형식의 이메일 생성 (캠핑장 정보, 날짜, 예약 가능 수 포함)
- Retry 전략을 적용하여 이메일 발송

**Kind**: instance method of [<code>NotificationService</code>](#NotificationService)  
**Throws**:

- <code>Error</code> 이메일 발송 실패 시


| Param | Type | Description |
| --- | --- | --- |
| userId | <code>string</code> | 사용자 ID |
| setting | <code>Object</code> | 사용자 설정 객체 |
| match | <code>Object</code> | 매칭된 예약 가능 정보 |

<a name="NotificationService+hasSettingNotified"></a>

### notificationService.hasSettingNotified(settingId) ⇒ <code>Promise.&lt;boolean&gt;</code>
중복 알림 방지를 위해 notifications 컬렉션에서 settingId로 조회

**Kind**: instance method of [<code>NotificationService</code>](#NotificationService)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - 알림 발송 이력이 있으면 true, 없으면 false  

| Param | Type | Description |
| --- | --- | --- |
| settingId | <code>string</code> | 사용자 설정 ID |

<a name="ScraperService"></a>

## ScraperService
캠핑장 스크래핑 서비스

**Kind**: global class  

* [ScraperService](#ScraperService)
    * [new exports.ScraperService()](#new_ScraperService_new)
    * [.scrapeCampingSite(activeSettings)](#ScraperService+scrapeCampingSite) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.parsePage(page, _month)](#ScraperService+parsePage) ⇒ <code>Promise.&lt;Array&gt;</code>

<a name="new_ScraperService_new"></a>

### new exports.ScraperService()
Playwright를 사용하여 캠핑장 예약 가능 현황을 스크래핑하는 서비스

<a name="ScraperService+scrapeCampingSite"></a>

### scraperService.scrapeCampingSite(activeSettings) ⇒ <code>Promise.&lt;number&gt;</code>
- Chromium 헤드리스 브라우저로 캠핑 사이트 접속
- 활성 설정의 날짜 범위에서 월 추출, 없으면 기본 3개월 스크래핑
- 각 월별 페이지를 파싱하여 예약 가능 데이터 수집
- Firestore에 일괄 저장 및 스크래핑 로그 기록

**Kind**: instance method of [<code>ScraperService</code>](#ScraperService)  
**Returns**: <code>Promise.&lt;number&gt;</code> - 스크래핑된 항목 수  
**Throws**:

- <code>Error</code> 브라우저 실행 또는 스크래핑 실패 시


| Param | Type | Description |
| --- | --- | --- |
| activeSettings | <code>Array</code> | 활성화된 사용자 설정 목록 (스크래핑할 월 결정에 사용) |

<a name="ScraperService+parsePage"></a>

### scraperService.parsePage(page, _month) ⇒ <code>Promise.&lt;Array&gt;</code>
- HTML 구조: <div id="YYYY-MM-DD"> 내부의 <dl class="schedule"> 파싱
- 각 dl 요소에서 구역명(dd)과 예약 가능 수(dt) 추출
- 날짜별, 구역별 예약 가능 현황을 배열로 반환

**Kind**: instance method of [<code>ScraperService</code>](#ScraperService)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - 예약 가능 데이터 배열  

| Param | Type | Description |
| --- | --- | --- |
| page | <code>Page</code> | Playwright 페이지 객체 |
| _month | <code>string</code> | 스크래핑 대상 월 (YYYY-MM, 로깅 용도) |

<a name="config"></a>

## config
Centralized Configuration

**Kind**: global constant  
<a name="errorHandler"></a>

## errorHandler
Global error handler middleware

**Kind**: global constant  
<a name="notFoundHandler"></a>

## notFoundHandler
Handle 404 errors

**Kind**: global constant  
<a name="asyncHandler"></a>

## asyncHandler
Async handler wrapper to catch errors in async route handlers

**Kind**: global constant  
<a name="requestIdMiddleware"></a>

## requestIdMiddleware
Add unique request ID to each request for tracing

**Kind**: global constant  
<a name="logRequestMiddleware"></a>

## logRequestMiddleware
Add request ID to logger context

**Kind**: global constant  
<a name="getKoreaDate"></a>

## getKoreaDate
Get current date in Korea timezone (KST: UTC+9)

**Kind**: global constant  
<a name="getKoreaHour"></a>

## getKoreaHour
Get current hour in Korea timezone (0-23)

**Kind**: global constant  
<a name="isSleepTime"></a>

## isSleepTime
Check if current time is in sleep period (01:00 - 08:00 KST)

**Kind**: global constant  
<a name="formatDate"></a>

## formatDate
Format date to YYYY-MM-DD

**Kind**: global constant  
<a name="formatYearMonth"></a>

## formatYearMonth
Format date to YYYY-MM (for URL parameter)

**Kind**: global constant  
<a name="getMonthsToScrape"></a>

## getMonthsToScrape
Get array of months to scrape [current, next, next+1]

**Kind**: global constant  
<a name="getMonthsFromSettings"></a>

## getMonthsFromSettings ⇒ <code>Array</code>
Get unique months from active user settings

**Kind**: global constant  
**Returns**: <code>Array</code> - - Array of unique YYYY-MM strings sorted  

| Param | Type | Description |
| --- | --- | --- |
| activeSettings | <code>Array</code> | Array of active user settings |

<a name="getRandomDelay"></a>

## getRandomDelay
Get random delay between min and max seconds

**Kind**: global constant  
<a name="ERROR_CODES"></a>

## ERROR\_CODES
Error Code Reference

**Kind**: global constant  
<a name="retryStrategies"></a>

## retryStrategies
Retry specific operations with predefined strategies

**Kind**: global constant  

* [retryStrategies](#retryStrategies)
    * [.scraping()](#retryStrategies.scraping)
    * [.email()](#retryStrategies.email)
    * [.firestore()](#retryStrategies.firestore)
    * [.network()](#retryStrategies.network)

<a name="retryStrategies.scraping"></a>

### retryStrategies.scraping()
Scraping operations: 3 retries with exponential backoff

**Kind**: static method of [<code>retryStrategies</code>](#retryStrategies)  
<a name="retryStrategies.email"></a>

### retryStrategies.email()
Email sending: 2 retries with fixed 5-second delay

**Kind**: static method of [<code>retryStrategies</code>](#retryStrategies)  
<a name="retryStrategies.firestore"></a>

### retryStrategies.firestore()
Firestore operations: 3 retries with exponential backoff

**Kind**: static method of [<code>retryStrategies</code>](#retryStrategies)  
<a name="retryStrategies.network"></a>

### retryStrategies.network()
Network requests: 3 retries with exponential backoff

**Kind**: static method of [<code>retryStrategies</code>](#retryStrategies)  
<a name="validateConfig"></a>

## validateConfig()
Validate required configuration

**Kind**: global function  
<a name="matchesSetting"></a>

## matchesSetting(item, setting) ⇒ <code>boolean</code>
캠핑장명, 지역, 구역(OR), 날짜 범위 조건 검증

**Kind**: global function  
**Returns**: <code>boolean</code> - 조건 일치 시 true  

| Param | Type | Description |
| --- | --- | --- |
| item | <code>Object</code> | 예약 가능 항목 |
| setting | <code>Object</code> | 사용자 설정 |

<a name="startScheduler"></a>

## startScheduler()
- 10분마다 실행되는 Cron 작업 등록
- 실행 전 30-120초 랜덤 딜레이 추가 (서버 부하 분산)
- 수면 시간(01:00-08:00 KST) 체크하여 스킵
- 활성 설정이 있고 미래 날짜가 있을 때만 스크래핑 실행

**Kind**: global function  
<a name="stopScheduler"></a>

## stopScheduler()
실행 중인 Cron 작업을 중지하고 null로 초기화

**Kind**: global function  
<a name="checkForActiveSettings"></a>

## checkForActiveSettings() ⇒ <code>Promise.&lt;boolean&gt;</code>
- 모든 활성 사용자 설정 조회
- 각 설정의 dateFrom 또는 dateTo가 오늘 이후인지 확인
- 날짜가 지정되지 않은 설정도 활성으로 간주

**Kind**: global function  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - 미래 날짜를 포함한 활성 설정이 있으면 true  
<a name="executeScraping"></a>

## executeScraping() ⇒ <code>Promise.&lt;void&gt;</code>
- 활성 설정 기반으로 스크래핑 실행
- 스크래핑된 항목 수 로깅
- 최신 예약 가능 현황 조회
- 사용자 설정과 매칭하여 알림 발송

**Kind**: global function  
**Throws**:

- <code>Error</code> 스크래핑 또는 알림 발송 실패 시

<a name="runScrapingNow"></a>

## runScrapingNow() ⇒ <code>Promise.&lt;void&gt;</code>
스케줄러 대기 없이 즉시 스크래핑 실행 (개발/테스트 용도)

**Kind**: global function  
<a name="isOperationalError"></a>

## isOperationalError()
Check if error is operational (expected)

**Kind**: global function  
<a name="formatErrorResponse"></a>

## formatErrorResponse()
Format error for API response

**Kind**: global function  
<a name="retryWithBackoff"></a>

## retryWithBackoff(fn, options) ⇒ <code>Promise</code>
Retry a function with exponential backoff

**Kind**: global function  
**Returns**: <code>Promise</code> - - Result of function  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Async function to retry |
| options | <code>Object</code> | Retry options |

<a name="retryWithFixedDelay"></a>

## retryWithFixedDelay(fn, options) ⇒ <code>Promise</code>
Retry a function with fixed delay

**Kind**: global function  
**Returns**: <code>Promise</code> - - Result of function  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Async function to retry |
| options | <code>Object</code> | Retry options |

<a name="sleep"></a>

## sleep(ms) ⇒ <code>Promise</code>
Sleep utility

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ms | <code>number</code> | Milliseconds to sleep |

<a name="isRetryableError"></a>

## isRetryableError(error) ⇒ <code>boolean</code>
Check if error is retryable

**Kind**: global function  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="retryIfRetryable"></a>

## retryIfRetryable(fn, options) ⇒ <code>Promise</code>
Retry only if error is retryable

**Kind**: global function  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 
| options | <code>Object</code> | 

