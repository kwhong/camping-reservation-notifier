import admin from 'firebase-admin';
import { readFileSync, existsSync, readdirSync } from 'fs';
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
 * Restore Firestore from backup
 * @param {string} backupId - Backup timestamp identifier
 * @param {boolean} dryRun - If true, only show what would be restored
 */
async function restoreFirestore(backupId, dryRun = false) {
  try {
    const backupDir = join(__dirname, '../../backups', backupId);

    if (!existsSync(backupDir)) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const summaryPath = join(backupDir, 'backup-summary.json');
    if (!existsSync(summaryPath)) {
      throw new Error('Backup summary not found. Invalid backup.');
    }

    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));

    console.log(`\n🔄 Restoring Firestore from backup: ${backupId}`);
    console.log(`📅 Backup date: ${summary.timestamp}`);
    console.log(`📊 Total documents: ${summary.totalDocuments}`);

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
    }

    const restoreSummary = {
      timestamp: new Date().toISOString(),
      backupId,
      collections: {},
      totalRestored: 0
    };

    for (const [collectionName, info] of Object.entries(summary.collections)) {
      console.log(`\n📦 Restoring collection: ${collectionName}`);

      const filePath = join(backupDir, `${collectionName}.json`);
      const documents = JSON.parse(readFileSync(filePath, 'utf8'));

      if (dryRun) {
        console.log(`   Would restore ${documents.length} documents`);
        restoreSummary.collections[collectionName] = {
          documentCount: documents.length,
          status: 'dry-run'
        };
        continue;
      }

      // Use batch for efficient writes
      let batch = db.batch();
      let batchCount = 0;
      let restoredCount = 0;

      for (const doc of documents) {
        const docRef = db.collection(collectionName).doc(doc.id);
        batch.set(docRef, doc.data);
        batchCount++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          restoredCount += batchCount;
          console.log(`   Restored ${restoredCount}/${documents.length} documents...`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining documents
      if (batchCount > 0) {
        await batch.commit();
        restoredCount += batchCount;
      }

      console.log(`✅ Restored ${restoredCount} documents to ${collectionName}`);

      restoreSummary.collections[collectionName] = {
        documentCount: restoredCount,
        status: 'success'
      };
      restoreSummary.totalRestored += restoredCount;
    }

    if (dryRun) {
      console.log(`\n✅ Dry run completed!`);
      console.log(`   To actually restore, run without --dry-run flag`);
    } else {
      console.log(`\n✅ Restore completed successfully!`);
      console.log(`📊 Total documents restored: ${restoreSummary.totalRestored}`);
    }

    return restoreSummary;

  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

/**
 * List available backups
 */
function listBackups() {
  const backupsDir = join(__dirname, '../../backups');

  if (!existsSync(backupsDir)) {
    console.log('No backups found.');
    return;
  }

  console.log('📋 Available backups:\n');

  const backups = readdirSync(backupsDir);

  backups.forEach(backup => {
    const summaryPath = join(backupsDir, backup, 'backup-summary.json');
    if (existsSync(summaryPath)) {
      const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
      console.log(`- ${backup}`);
      console.log(`  Date: ${summary.timestamp}`);
      console.log(`  Total documents: ${summary.totalDocuments}`);
      console.log(`  Collections: ${Object.keys(summary.collections).join(', ')}\n`);
    }
  });

  console.log('To restore, run:');
  console.log('node scripts/restore-firestore.js --backup-id=<backup-id> [--dry-run]');
}

// CLI handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node restore-firestore.js [options]

Options:
  --backup-id=<id>    Backup ID to restore (timestamp)
  --dry-run           Show what would be restored without making changes
  --list              List all available backups
  --help, -h          Show this help message

Examples:
  node scripts/restore-firestore.js --list
  node scripts/restore-firestore.js --backup-id=2025-10-12T10-30-00-000Z --dry-run
  node scripts/restore-firestore.js --backup-id=2025-10-12T10-30-00-000Z
  `);
  process.exit(0);
}

if (args.includes('--list')) {
  listBackups();
  process.exit(0);
}

const backupIdArg = args.find(arg => arg.startsWith('--backup-id='));
if (!backupIdArg) {
  console.error('❌ Error: --backup-id is required');
  console.log('Run with --help for usage information');
  process.exit(1);
}

const backupId = backupIdArg.split('=')[1];
const dryRun = args.includes('--dry-run');

restoreFirestore(backupId, dryRun)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
