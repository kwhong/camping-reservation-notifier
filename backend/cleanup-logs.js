import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase 초기화
const serviceAccountPath = join(__dirname, '../camping-scraper-prod-firebase-설정.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function deleteCollection(collectionName) {
  console.log(`\n🗑️  Deleting ${collectionName} collection...`);

  const collectionRef = db.collection(collectionName);
  const batchSize = 500;
  let totalDeleted = 0;

  try {
    let query = collectionRef.limit(batchSize);

    while (true) {
      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.size;

      console.log(`   Deleted ${snapshot.size} documents (Total: ${totalDeleted})`);

      if (snapshot.size < batchSize) {
        break;
      }
    }

    console.log(`✅ ${collectionName} collection deleted successfully! Total: ${totalDeleted} documents`);
    return totalDeleted;

  } catch (error) {
    console.error(`❌ Error deleting ${collectionName}:`, error);
    throw error;
  }
}

async function cleanupLogs() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Firestore Logs Cleanup Script                   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\nThis script will delete:');
  console.log('  - notifications (알림 이력)');
  console.log('  - scrapingLogs (스크래핑 이력)');
  console.log('\nWill NOT delete:');
  console.log('  - users (사용자)');
  console.log('  - userSettings (사용자 설정)');
  console.log('  - availability (예약 가능 현황)');
  console.log('\n' + '='.repeat(50));

  try {
    // notifications 삭제
    const notificationsDeleted = await deleteCollection('notifications');

    // scrapingLogs 삭제
    const scrapingLogsDeleted = await deleteCollection('scrapingLogs');

    console.log('\n' + '='.repeat(50));
    console.log('✅ Cleanup completed successfully!');
    console.log(`\nTotal deleted:`);
    console.log(`  - notifications: ${notificationsDeleted}`);
    console.log(`  - scrapingLogs: ${scrapingLogsDeleted}`);
    console.log(`  - Total: ${notificationsDeleted + scrapingLogsDeleted}`);
    console.log('\n' + '='.repeat(50));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// 실행
cleanupLogs();
