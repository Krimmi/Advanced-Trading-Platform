/**
 * MongoDB Rollback Script for Hedge Fund Trading Application
 * 
 * This script provides database rollback capabilities for MongoDB
 * It can restore collections from backups and handle schema migrations
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  development: {
    uri: process.env.DEV_MONGODB_URI || 'mongodb://localhost:27017/hedge_fund_dev',
    backupDir: process.env.DEV_BACKUP_DIR || './backups/development'
  },
  staging: {
    uri: process.env.STAGING_MONGODB_URI || 'mongodb://localhost:27017/hedge_fund_staging',
    backupDir: process.env.STAGING_BACKUP_DIR || './backups/staging'
  },
  production: {
    uri: process.env.PROD_MONGODB_URI || 'mongodb://localhost:27017/hedge_fund_prod',
    backupDir: process.env.PROD_BACKUP_DIR || './backups/production'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
const backupId = args.find(arg => arg.startsWith('--backup='))?.split('=')[1];
const collections = args.find(arg => arg.startsWith('--collections='))?.split('=')[1]?.split(',') || [];
const dryRun = args.includes('--dry-run');

// Validate inputs
if (!['development', 'staging', 'production'].includes(environment)) {
  console.error('Error: Environment must be one of: development, staging, production');
  process.exit(1);
}

if (!backupId) {
  console.error('Error: Backup ID is required (--backup=BACKUP_ID)');
  process.exit(1);
}

const envConfig = config[environment];

/**
 * Get available backups for the environment
 */
async function getAvailableBackups() {
  try {
    const backupDir = envConfig.backupDir;
    if (!fs.existsSync(backupDir)) {
      console.error(`Error: Backup directory ${backupDir} does not exist`);
      process.exit(1);
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => fs.statSync(path.join(backupDir, file)).isDirectory());
    
    return backups;
  } catch (error) {
    console.error('Error getting available backups:', error);
    process.exit(1);
  }
}

/**
 * Get collections in a backup
 */
async function getBackupCollections(backupId) {
  try {
    const backupDir = path.join(envConfig.backupDir, backupId);
    if (!fs.existsSync(backupDir)) {
      console.error(`Error: Backup ${backupId} does not exist`);
      process.exit(1);
    }
    
    const collections = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    return collections;
  } catch (error) {
    console.error('Error getting backup collections:', error);
    process.exit(1);
  }
}

/**
 * Create a backup of the current database state
 */
async function createCurrentBackup(client, dbName) {
  try {
    console.log('Creating backup of current database state...');
    
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    const backupId = `pre_rollback_${new Date().toISOString().replace(/[:.]/g, '_')}`;
    const backupDir = path.join(envConfig.backupDir, backupId);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    for (const collection of collections) {
      const collectionName = collection.name;
      if (collectionName.startsWith('system.')) continue;
      
      const data = await db.collection(collectionName).find({}).toArray();
      fs.writeFileSync(
        path.join(backupDir, `${collectionName}.json`),
        JSON.stringify(data, null, 2)
      );
    }
    
    console.log(`Current database state backed up to ${backupId}`);
    return backupId;
  } catch (error) {
    console.error('Error creating current backup:', error);
    process.exit(1);
  }
}

/**
 * Restore database from backup
 */
async function restoreFromBackup(client, dbName, backupId, collectionsToRestore) {
  try {
    const backupDir = path.join(envConfig.backupDir, backupId);
    if (!fs.existsSync(backupDir)) {
      console.error(`Error: Backup ${backupId} does not exist`);
      process.exit(1);
    }
    
    const db = client.db(dbName);
    const availableCollections = await getBackupCollections(backupId);
    
    // If no specific collections are provided, restore all available collections
    const targetCollections = collectionsToRestore.length > 0 
      ? collectionsToRestore.filter(c => availableCollections.includes(c))
      : availableCollections;
    
    if (targetCollections.length === 0) {
      console.error('Error: No valid collections to restore');
      process.exit(1);
    }
    
    console.log(`Restoring collections: ${targetCollections.join(', ')}`);
    
    for (const collectionName of targetCollections) {
      const backupFile = path.join(backupDir, `${collectionName}.json`);
      
      if (!fs.existsSync(backupFile)) {
        console.warn(`Warning: Backup file for collection ${collectionName} not found, skipping`);
        continue;
      }
      
      const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      if (dryRun) {
        console.log(`[DRY RUN] Would restore ${data.length} documents to collection ${collectionName}`);
        continue;
      }
      
      // Drop existing collection
      if (await db.listCollections({ name: collectionName }).hasNext()) {
        await db.collection(collectionName).drop();
      }
      
      // Restore data
      if (data.length > 0) {
        await db.collection(collectionName).insertMany(data);
      } else {
        // Create empty collection
        await db.createCollection(collectionName);
      }
      
      console.log(`Restored collection ${collectionName} (${data.length} documents)`);
    }
    
    console.log('Database restore completed successfully');
  } catch (error) {
    console.error('Error restoring from backup:', error);
    process.exit(1);
  }
}

/**
 * Apply schema migrations if needed
 */
async function applyMigrations(client, dbName, backupId) {
  try {
    const migrationsDir = path.join(envConfig.backupDir, backupId, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations to apply');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    if (dryRun) {
      console.log(`[DRY RUN] Would apply migrations: ${migrationFiles.join(', ')}`);
      return;
    }
    
    const db = client.db(dbName);
    
    for (const migrationFile of migrationFiles) {
      console.log(`Applying migration: ${migrationFile}`);
      
      const migration = require(path.join(migrationsDir, migrationFile));
      await migration.up(db);
      
      console.log(`Migration ${migrationFile} applied successfully`);
    }
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`MongoDB Rollback - Environment: ${environment}, Backup: ${backupId}`);
  
  if (dryRun) {
    console.log('DRY RUN MODE - No changes will be made to the database');
  }
  
  // Connect to MongoDB
  let client;
  try {
    client = new MongoClient(envConfig.uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const dbName = new URL(envConfig.uri).pathname.substring(1);
    
    // Create backup of current state
    if (!dryRun) {
      await createCurrentBackup(client, dbName);
    }
    
    // Confirm rollback
    if (!dryRun) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`Are you sure you want to rollback to backup ${backupId}? This action cannot be undone. (yes/no): `, resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Rollback cancelled');
        process.exit(0);
      }
    }
    
    // Restore from backup
    await restoreFromBackup(client, dbName, backupId, collections);
    
    // Apply migrations
    await applyMigrations(client, dbName, backupId);
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Error during rollback:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
main().catch(console.error);