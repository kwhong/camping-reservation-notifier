import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = join(__dirname, '../../camping-scraper-prod-firebase-설정.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Cleanup duplicate data in availability collection
 * Keeps only the most recent document for each unique key
 */
async function cleanupDuplicates(dryRun = true) {
  try {
    const mode = dryRun ? 'DRY RUN' : 'LIVE';
    console.log(`🧹 Starting cleanup in ${mode} mode...\n`);

    if (!dryRun) {
      console.warn('⚠️  WARNING: This will permanently delete duplicate documents!');
      console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Fetch all availability documents
    const snapshot = await db.collection('availability').get();
    const totalDocuments = snapshot.size;

    console.log(`📊 Total documents: ${totalDocuments}`);

    // Group by unique key
    const uniqueDataMap = new Map();

    snapshot.forEach(doc => {
      const data = doc.data();
      const key = `${data.campingName}|${data.region}|${data.area}|${data.date}`;

      if (!uniqueDataMap.has(key)) {
        uniqueDataMap.set(key, []);
      }

      uniqueDataMap.set(key, [...uniqueDataMap.get(key), {
        id: doc.id,
        scrapedAt: data.scrapedAt?.toDate ? data.scrapedAt.toDate() : data.scrapedAt,
        data
      }]);
    });

    // Identify documents to delete
    const documentsToDelete = [];
    const documentsToKeep = [];

    uniqueDataMap.forEach((docs, key) => {
      // Sort by scrapedAt (newest first)
      docs.sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));

      // Keep the first (most recent), delete the rest
      documentsToKeep.push(docs[0]);

      if (docs.length > 1) {
        documentsToDelete.push(...docs.slice(1));
      }
    });

    console.log(`✅ Documents to keep: ${documentsToKeep.length}`);
    console.log(`🗑️  Documents to delete: ${documentsToDelete.length}\n`);

    if (documentsToDelete.length === 0) {
      console.log('✅ No duplicates found. Database is already clean!\n');
      return;
    }

    // Show sample of what will be deleted
    console.log('📋 Sample documents to delete (first 5):\n');
    documentsToDelete.slice(0, 5).forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Scraped: ${doc.scrapedAt}`);
      console.log(`   Data: ${doc.data.campingName} / ${doc.data.area} / ${doc.data.date}\n`);
    });

    // Delete duplicates
    if (!dryRun) {
      console.log('🔄 Starting deletion...\n');

      let batch = db.batch();
      let batchCount = 0;
      let deletedCount = 0;

      for (const doc of documentsToDelete) {
        batch.delete(db.collection('availability').doc(doc.id));
        batchCount++;

        // Firestore batch limit is 500
        if (batchCount >= 500) {
          await batch.commit();
          deletedCount += batchCount;
          console.log(`   Deleted ${deletedCount}/${documentsToDelete.length} documents...`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
        deletedCount += batchCount;
      }

      console.log(`\n✅ Successfully deleted ${deletedCount} duplicate documents!`);

      // Save deletion log
      const logDir = join(__dirname, '../../logs');
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }

      const logFile = join(logDir, `cleanup-${Date.now()}.json`);
      const logData = {
        timestamp: new Date().toISOString(),
        totalBefore: totalDocuments,
        totalAfter: documentsToKeep.length,
        deleted: deletedCount,
        deletedDocIds: documentsToDelete.map(d => d.id)
      };

      writeFileSync(logFile, JSON.stringify(logData, null, 2));
      console.log(`📝 Deletion log saved: ${logFile}\n`);

    } else {
      console.log('✅ Dry run completed!');
      console.log('   To actually delete, run without --dry-run flag:\n');
      console.log('   node scripts/cleanup-duplicates.js\n');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// CLI handling
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

cleanupDuplicates(dryRun)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
