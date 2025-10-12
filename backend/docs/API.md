## Classes

<dl>
<dt><a href="#HealthService">HealthService</a></dt>
<dd><p>Health Check Service</p>
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

