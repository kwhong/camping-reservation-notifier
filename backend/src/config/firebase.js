import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let auth = null;

export const initializeFirebase = () => {
  try {
    // Load service account key
    const serviceAccountPath = join(__dirname, '../../../camping-scraper-prod-firebase-설정.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    auth = admin.auth();

    console.log('✅ Firebase initialized successfully'); // Keep console.log for startup visibility
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

export const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase first.');
  }
  return db;
};

export const getAuth = () => {
  if (!auth) {
    throw new Error('Auth not initialized. Call initializeFirebase first.');
  }
  return auth;
};

export { admin };
