import admin from 'firebase-admin';
import { readFileSync } from 'fs';
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
 * Analyze duplicate data in availability collection
 */
async function analyzeDuplicates() {
  try {
    console.log('🔍 Analyzing duplicate data in availability collection...\n');

    // Fetch all availability documents
    const snapshot = await db.collection('availability').get();
    const totalDocuments = snapshot.size;

    console.log(`📊 Total documents: ${totalDocuments}`);

    // Group by unique key (campingName + region + area + date)
    const uniqueDataMap = new Map();
    const duplicateGroups = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const key = `${data.campingName}|${data.region}|${data.area}|${data.date}`;

      if (!uniqueDataMap.has(key)) {
        uniqueDataMap.set(key, []);
      }

      uniqueDataMap.set(key, [...uniqueDataMap.get(key), {
        id: doc.id,
        ...data,
        scrapedAt: data.scrapedAt?.toDate ? data.scrapedAt.toDate() : data.scrapedAt
      }]);
    });

    // Find duplicates
    uniqueDataMap.forEach((docs, key) => {
      if (docs.length > 1) {
        duplicateGroups.push({
          key,
          count: docs.length,
          documents: docs.sort((a, b) =>
            new Date(b.scrapedAt) - new Date(a.scrapedAt)
          )
        });
      }
    });

    const uniqueRecords = uniqueDataMap.size;
    const duplicateRecords = totalDocuments - uniqueRecords;
    const duplicatePercentage = ((duplicateRecords / totalDocuments) * 100).toFixed(2);

    console.log(`📈 Unique records: ${uniqueRecords}`);
    console.log(`📉 Duplicate records: ${duplicateRecords} (${duplicatePercentage}%)`);
    console.log(`🔢 Duplicate groups: ${duplicateGroups.length}\n`);

    // Show top 10 duplicate groups
    if (duplicateGroups.length > 0) {
      console.log('🔝 Top 10 duplicate groups:\n');

      duplicateGroups
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .forEach((group, index) => {
          const [campingName, region, area, date] = group.key.split('|');
          console.log(`${index + 1}. ${campingName} / ${area} / ${date}`);
          console.log(`   Duplicates: ${group.count}`);
          console.log(`   Latest: ${group.documents[0].scrapedAt}`);
          console.log(`   Oldest: ${group.documents[group.count - 1].scrapedAt}\n`);
        });
    }

    // Estimate storage savings
    const avgDocSize = 500; // bytes (estimate)
    const storageSavingsKB = ((duplicateRecords * avgDocSize) / 1024).toFixed(2);

    console.log(`💾 Estimated storage savings: ${storageSavingsKB} KB`);

    // Generate cleanup summary
    console.log('\n📝 Cleanup Summary:');
    console.log(`   Documents to keep: ${uniqueRecords}`);
    console.log(`   Documents to delete: ${duplicateRecords}`);
    console.log(`   Estimated time: ${Math.ceil(duplicateRecords / 500)} seconds (batch of 500)\n`);

    // Generate cleanup script command
    if (duplicateRecords > 0) {
      console.log('To cleanup duplicates, run:');
      console.log('node scripts/cleanup-duplicates.js --dry-run');
      console.log('node scripts/cleanup-duplicates.js  # actual cleanup\n');
    } else {
      console.log('✅ No duplicates found. Database is clean!\n');
    }

    // Detailed report by date
    console.log('📅 Duplicates by date:\n');
    const dateMap = new Map();

    duplicateGroups.forEach(group => {
      const [, , , date] = group.key.split('|');
      if (!dateMap.has(date)) {
        dateMap.set(date, 0);
      }
      dateMap.set(date, dateMap.get(date) + (group.count - 1));
    });

    Array.from(dateMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([date, count]) => {
        console.log(`   ${date}: ${count} duplicates`);
      });

    return {
      totalDocuments,
      uniqueRecords,
      duplicateRecords,
      duplicatePercentage,
      duplicateGroups: duplicateGroups.length
    };

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

// Run analysis
analyzeDuplicates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
