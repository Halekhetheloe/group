const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to backup
const collectionsToBackup = [
  'users',
  'institutions',
  'courses',
  'applications',
  'companies',
  'jobs',
  'jobApplications',
  'transcripts',
  'notifications',
  'system'
];

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async backupCollection(collectionName) {
    try {
      console.log(`📦 Backing up ${collectionName}...`);
      
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        
        // Convert Firestore Timestamps to ISO strings for JSON serialization
        const processedData = this.processTimestamps(docData);
        
        data.push({
          id: doc.id,
          ...processedData
        });
      });
      
      console.log(`✅ Backed up ${data.length} documents from ${collectionName}`);
      return data;
    } catch (error) {
      console.error(`❌ Error backing up collection ${collectionName}:`, error);
      throw error;
    }
  }

  processTimestamps(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.processTimestamps(item));
    }

    const processed = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value.toDate) {
        // Firestore Timestamp
        processed[key] = value.toDate().toISOString();
      } else if (value instanceof Date) {
        processed[key] = value.toISOString();
      } else if (typeof value === 'object') {
        processed[key] = this.processTimestamps(value);
      } else {
        processed[key] = value;
      }
    }
    
    return processed;
  }

  async createBackup() {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const backupId = `backup-${timestamp}`;
      const backupFile = path.join(this.backupDir, `${backupId}.json`);
      
      console.log('🚀 Starting database backup...');
      console.log(`📁 Backup file: ${backupFile}\n`);

      const backupData = {
        metadata: {
          id: backupId,
          timestamp: new Date().toISOString(),
          version: '1.0',
          collections: collectionsToBackup.length
        },
        data: {}
      };

      // Backup each collection
      for (const collectionName of collectionsToBackup) {
        backupData.data[collectionName] = await this.backupCollection(collectionName);
      }

      // Write backup to file
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      // Create a summary file
      await this.createBackupSummary(backupData, backupFile);
      
      console.log('\n✅ Backup completed successfully!');
      console.log(`📊 Total documents backed up: ${this.countTotalDocuments(backupData.data)}`);
      console.log(`💾 Backup saved to: ${backupFile}`);
      
      return backupFile;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  async createBackupSummary(backupData, backupFile) {
    const summary = {
      backupId: backupData.metadata.id,
      timestamp: backupData.metadata.timestamp,
      collections: {}
    };

    for (const [collectionName, documents] of Object.entries(backupData.data)) {
      summary.collections[collectionName] = {
        count: documents.length,
        size: Buffer.from(JSON.stringify(documents)).length
      };
    }

    const summaryFile = backupFile.replace('.json', '-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    return summaryFile;
  }

  countTotalDocuments(data) {
    return Object.values(data).reduce((total, collection) => total + collection.length, 0);
  }

  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json') && file.includes('backup-'))
        .sort()
        .reverse();

      console.log('📋 Available backups:');
      
      if (files.length === 0) {
        console.log('   No backups found');
        return [];
      }

      files.forEach((file, index) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log(`   ${index + 1}. ${file} (${size} MB)`);
      });

      return files;
    } catch (error) {
      console.error('❌ Error listing backups:', error);
      return [];
    }
  }

  getBackupInfo(backupFile) {
    try {
      const backupPath = path.join(this.backupDir, backupFile);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      const stats = fs.statSync(backupPath);
      
      return {
        filename: backupFile,
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        timestamp: backupData.metadata.timestamp,
        collections: Object.keys(backupData.data).length,
        totalDocuments: this.countTotalDocuments(backupData.data)
      };
    } catch (error) {
      console.error('❌ Error getting backup info:', error);
      return null;
    }
  }

  async cleanupOldBackups(retentionDays = 7) {
    try {
      console.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);
      
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json') && file.includes('backup-'));
      
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          
          // Also delete summary file if it exists
          const summaryFile = filePath.replace('.json', '-summary.json');
          if (fs.existsSync(summaryFile)) {
            fs.unlinkSync(summaryFile);
          }
          
          console.log(`🗑️  Deleted old backup: ${file}`);
          deletedCount++;
        }
      }

      console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups.`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old backups:', error);
      throw error;
    }
  }

  async scheduleBackup() {
    // This would be used with a cron job for automated backups
    console.log('⏰ Scheduling automated backup...');
    
    try {
      await this.createBackup();
      await this.cleanupOldBackups();
      
      console.log('✅ Scheduled backup completed');
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
    }
  }
}

// Command line interface
async function main() {
  const backupManager = new BackupManager();
  const command = process.argv[2];

  switch (command) {
    case 'list':
      backupManager.listBackups();
      break;
      
    case 'info':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('❌ Please specify a backup file: npm run backup:info <backup-file>');
        process.exit(1);
      }
      const info = backupManager.getBackupInfo(backupFile);
      if (info) {
        console.log('📊 Backup Information:');
        console.log(`   File: ${info.filename}`);
        console.log(`   Size: ${info.size}`);
        console.log(`   Date: ${info.timestamp}`);
        console.log(`   Collections: ${info.collections}`);
        console.log(`   Documents: ${info.totalDocuments}`);
      }
      break;
      
    case 'cleanup':
      const days = parseInt(process.argv[3]) || 7;
      await backupManager.cleanupOldBackups(days);
      break;
      
    case 'schedule':
      await backupManager.scheduleBackup();
      break;
      
    case 'create':
    default:
      await backupManager.createBackup();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BackupManager;