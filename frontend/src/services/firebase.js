import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDvP37wuB4OahIHoqwpSBls_Wzi3UvF9Iw",
  authDomain: "camping-scraper-prod.firebaseapp.com",
  projectId: "camping-scraper-prod",
  storageBucket: "camping-scraper-prod.firebasestorage.app",
  messagingSenderId: "211415966587",
  appId: "1:211415966587:web:b4e31bf0c6459a1792d3de",
  measurementId: "G-13PJTDS47M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
