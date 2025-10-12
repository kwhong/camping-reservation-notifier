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

const COLLECTIONS = ['users', 'userSettings', 'availability', 'notifications', 'scrapingLogs'];

/**
 * Backup all Firestore collections to JSON files
 */
async function backupFirestore() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(__dirname, '../../backups', timestamp);

    // Create backup directory
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    console.log(`🔄 Starting Firestore backup to: ${backupDir}`);

    const backupSummary = {
      timestamp,
      collections: {},
      totalDocuments: 0
    };

    for (const collectionName of COLLECTIONS) {
      console.log(`\n📦 Backing up collection: ${collectionName}`);

      const snapshot = await db.collection(collectionName).get();
      const documents = [];

      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          data: doc.data()
        });
      });

      // Save to JSON file
      const filePath = join(backupDir, `${collectionName}.json`);
      writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');

      console.log(`✅ Backed up ${documents.length} documents from ${collectionName}`);

      backupSummary.collections[collectionName] = {
        documentCount: documents.length,
        filePath
      };
      backupSummary.totalDocuments += documents.length;
    }

    // Save backup summary
    const summaryPath = join(backupDir, 'backup-summary.json');
    writeFileSync(summaryPath, JSON.stringify(backupSummary, null, 2), 'utf8');

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📊 Total documents: ${backupSummary.totalDocuments}`);
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`\nTo restore, run:`);
    console.log(`node scripts/restore-firestore.js --backup-id=${timestamp}`);

    return backupSummary;

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

/**
 * List all available backups
 */
function listBackups() {
  const backupsDir = join(__dirname, '../../backups');

  if (!existsSync(backupsDir)) {
    console.log('No backups found.');
    return;
  }

  console.log('📋 Available backups:\n');

  const fs = await import('fs');
  const backups = fs.readdirSync(backupsDir);

  backups.forEach(backup => {
    const summaryPath = join(backupsDir, backup, 'backup-summary.json');
    if (existsSync(summaryPath)) {
      const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
      console.log(`- ${backup}`);
      console.log(`  Total documents: ${summary.totalDocuments}`);
      console.log(`  Collections: ${Object.keys(summary.collections).join(', ')}\n`);
    }
  });
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listBackups();
} else {
  backupFirestore()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
