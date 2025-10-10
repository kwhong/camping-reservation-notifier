# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Camping site reservation notification system that scrapes camping availability and sends alerts to users when spots become available. Full-stack application with automated scraping scheduler.

**Tech Stack:**
- Backend: Node.js (ES modules), Express, Playwright, node-cron, Firebase Admin, Nodemailer
- Frontend: React + Vite, Ant Design, Tailwind CSS, Firebase Auth
- Database: Firestore
- Target: 다리안계곡캠핑장 (mirihae.com)

## Development Commands

### Backend
```bash
cd backend
npm install                    # Install dependencies
npm run dev                    # Development mode with nodemon
npm start                      # Production mode
```

Backend runs on `http://localhost:3000`

### Frontend
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Development server (Vite)
npm run build                  # Production build
npm run preview                # Preview production build
```

Frontend runs on `http://localhost:5173`

## Critical Architecture Concepts

### Scheduler Flow (Backend Entry Point)
The system automatically starts when `backend/src/app.js` launches:
1. `app.js` calls `startScheduler()` on server start
2. Scheduler runs every minute with 5-20s random delay
3. **Sleep time**: Skips execution 01:00-08:00 KST
4. **Conditional execution**: Only runs if active user settings with future dates exist
5. Executes: scraping → notification checking → Firestore storage

Critical files: `scheduler.service.js`, `scraper.service.js`, `notification.service.js`

### Scraping Logic
- Scrapes 3 months: Current month (M), M+1, M+2
- Uses Playwright headless browser
- Parses HTML structure:
  - Areas: `<dl>` tags (데크A/B/C/D, 원두막, 돔하우스)
  - Dates: `<a>` tags within `<div class="element">`
  - Availability count: `<dt>` tags
- All scraped data stored in Firestore `availability` collection
- Scraping logs stored with status (success/error/running)

### Notification System
After each scrape, checks user settings against new availability:
1. Fetches all active `userSettings` from Firestore
2. Matches conditions: campingName, region, area[], dateRange
3. Sends email via Gmail SMTP (nodemailer)
4. **Duplicate prevention**: Won't notify same user for same camping-area-date within 24h
5. Logs all notifications in `notifications` collection

### Authentication Flow
- Frontend: Firebase Client SDK (email/password + Google OAuth)
- Backend: Firebase Admin SDK verifies ID tokens via middleware
- All API routes (except `/health`) require `authenticateUser` middleware
- Token sent as `Authorization: Bearer <token>` header

### Firestore Schema
Collections (all managed via `firestore.service.js`):
- `users`: User profiles (email, displayName, notificationEmail)
- `userSettings`: User camping preferences (campingName, region, area[], dateFrom, dateTo, isActive)
- `availability`: Scraped availability data (campingName, region, area, date, availableCount, scrapedAt)
- `notifications`: Notification history (userId, settingId, campingName, area, date, notificationType, sentAt)
- `scrapingLogs`: Scraping execution logs (startedAt, completedAt, status, itemsScraped, errorMessage)

### Date/Time Handling
All date utilities in `backend/src/utils/date.js`:
- Uses Korea timezone (KST/UTC+9) for all operations
- `getKoreaDate()`: Current time in KST
- `isSleepTime()`: Checks if 01:00-08:00 KST
- `getMonthsToScrape()`: Returns [YYYY-MM, YYYY-MM+1, YYYY-MM+2]
- `getRandomDelay(min, max)`: Random milliseconds for scheduler

## Environment Variables

### Backend (.env)
```
PORT=3000
NODE_ENV=development
EMAIL_USER=<gmail-address>
EMAIL_APP_PASSWORD=<gmail-app-password>
```

Firebase service account: `camping-scraper-prod-firebase-설정.json` must exist at project root.

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

Firebase config is hardcoded in `frontend/src/services/firebase.js` (apiKey, authDomain, etc.)

## API Structure

All routes prefixed with `/api`:
- `/api/auth/*` - Authentication (verify token, update profile)
- `/api/settings/*` - CRUD for user camping settings
- `/api/availability` - Query available camping sites
- `/api/logs/*` - Notification and scraping history

API client (`frontend/src/services/api.js`) automatically injects Firebase auth token via axios interceptor.

## Key Service Interactions

**Scraping → Notification Flow:**
```
scheduler.service.js (cron trigger)
  → scraper.service.js (Playwright scraping)
    → firestore.service.js (save availability)
  → notification.service.js (match user settings)
    → email.js (send via nodemailer)
    → firestore.service.js (log notification)
```

**Frontend Auth Flow:**
```
Login.jsx (Firebase signIn)
  → AuthContext.jsx (onAuthStateChanged)
    → api.js (auto-inject token in axios)
      → Backend auth.middleware.js (verify token)
```

## Important Constraints

1. **Scraper HTML parsing** is tightly coupled to mirihae.com DOM structure - if site changes, update `scraper.service.js` parsing logic
2. **Email sending** requires Gmail account with App Password (not regular password)
3. **Firebase service account** path is hardcoded in `backend/src/config/firebase.js` (relative path: `../../../camping-scraper-prod-firebase-설정.json`)
4. **Scheduler runs immediately** on server start - no manual trigger needed
5. **Firestore timestamps** may return as objects with `seconds` property - handle both Date and timestamp objects when rendering

## Debugging

- Backend logs: Check console output with emoji prefixes (🚀, ⏰, 😴, ✅, ❌)
- Manual scraping: Call `runScrapingNow()` from `scheduler.service.js`
- Check Firestore directly for `scrapingLogs` collection to see error messages
- Frontend API errors: Browser console shows axios interceptor errors
- Health check: `GET http://localhost:3000/health` (no auth required)
