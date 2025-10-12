import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized Configuration
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // CORS Configuration
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowedOrigins: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true
  },

  // Email Configuration
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_APP_PASSWORD,
    from: `캠핑장 알림 <${process.env.EMAIL_USER}>`,
    retryAttempts: 2,
    retryDelay: 5000 // ms
  },

  // Firebase Configuration
  firebase: {
    serviceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT || '../../../camping-scraper-prod-firebase-설정.json',
    projectId: process.env.FIREBASE_PROJECT_ID || 'camping-scraper-prod'
  },

  // Scraper Configuration
  scraper: {
    baseUrl: 'https://mirihae.com/camping/calendar.do',
    baseParams:
      'checkType=&device=pc&tocken=20251009233437-4cb6fa5d-17f6-471d-8830-3b10d580e648&pageId=G24526799&groupCode=dytc&selectStartDate=&selectEndDate=&selectItemId=&selectTicketId=&cnt=&infoType=&approvalId=&txId=',
    camping: {
      name: '다리안계곡캠핑장',
      region: '충북 단양'
    },
    timeout: {
      launch: 30000, // 30 seconds
      page: 30000, // 30 seconds
      overall: 5 * 60 * 1000 // 5 minutes
    },
    retryAttempts: 3,
    retryDelay: {
      initial: 2000, // 2 seconds
      max: 30000, // 30 seconds
      factor: 2
    }
  },

  // Scheduler Configuration
  scheduler: {
    cronExpression: '*/10 * * * *', // Every 10 minutes
    randomDelay: {
      min: 30, // seconds
      max: 120 // seconds
    },
    sleepHours: {
      start: 1, // 01:00 KST
      end: 8 // 08:00 KST
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileSize: 5242880, // 5MB
    maxFiles: 5
  },

  // Database Configuration
  firestore: {
    batchSize: 500, // Firestore batch limit
    queryLimit: 500
  },

  // Retry Configuration
  retry: {
    scraping: {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      factor: 2
    },
    email: {
      maxRetries: 2,
      delay: 5000
    },
    firestore: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      factor: 2
    },
    network: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 15000,
      factor: 2
    }
  }
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const required = {
    EMAIL_USER: config.email.user,
    EMAIL_APP_PASSWORD: config.email.password
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Export individual configs for convenience
export const {
  server,
  cors: corsConfig,
  email: emailConfig,
  firebase: firebaseConfig,
  scraper: scraperConfig,
  scheduler: schedulerConfig,
  logging: loggingConfig,
  firestore: firestoreConfig,
  retry: retryConfig
} = config;
