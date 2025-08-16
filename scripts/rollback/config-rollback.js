/**
 * Configuration Rollback Script for Hedge Fund Trading Application
 * 
 * This script provides rollback capabilities for application configuration
 * It can restore configuration files from backups and handle environment-specific settings
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Configuration
const CONFIG_PATHS = {
  development: {
    appConfig: process.env.DEV_APP_CONFIG_PATH || './config/development.json',
    apiKeys: process.env.DEV_API_KEYS_PATH || './config/api-keys.development.json',
    featureFlags: process.env.DEV_FEATURE_FLAGS_PATH || './config/feature-flags.development.json',
    backupDir: process.env.DEV_CONFIG_BACKUP_DIR || './backups/config/development'
  },
  staging: {
    appConfig: process.env.STAGING_APP_CONFIG_PATH || './config/staging.json',
    apiKeys: process.env.STAGING_API_KEYS_PATH || './config/api-keys.staging.json',
    featureFlags: process.env.STAGING_FEATURE_FLAGS_PATH || './config/feature-flags.staging.json',
    backupDir: process.env.STAGING_CONFIG_BACKUP_DIR || './backups/config/staging'
  },
  production: {
    appConfig: process.env.PROD_APP_CONFIG_PATH || './config/production.json',
    apiKeys: process.env.PROD_API_KEYS_PATH || './config/api-keys.production.json',
    featureFlags: process.env.PROD_FEATURE_FLAGS_PATH || './config/feature-flags.production.json',
    backupDir: process.env.PROD_CONFIG_BACKUP_DIR || './backups/config/production'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
const backupId = args.find(arg => arg.startsWith('--backup='))?.split('=')[1];
const configType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
const dryRun = args.includes('--dry-run');
const skipConfirmation = args.includes('--skip-confirmation');

// Validate inputs
if (!['development', 'staging', 'production'].includes(environment)) {
  console.error('Error: Environment must be one of: development, staging, production');
  process.exit(1);
}

if (!backupId && !args.includes('--list-backups')) {
  console.error('Error: Backup ID is required (--backup=BACKUP_ID) or use --list-backups to see available backups');
  process.exit(1);
}

if (!['all', 'appConfig', 'apiKeys', 'featureFlags'].includes(configType)) {
  console.error('Error: Config type must be one of: all, appConfig, apiKeys, featureFlags');
  process.exit(1);
}

const envConfig = CONFIG_PATHS[environment];

/**
 * List available configuration backups
 */
function listBackups() {
  try {
    const backupDir = envConfig.backupDir;
    if (!fs.existsSync(backupDir)) {
      console.log(`No backups found for ${environment} environment`);
      return;
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => fs.statSync(path.join(backupDir, file)).isDirectory())
      .sort((a, b) => {
        const aTime = fs.statSync(path.join(backupDir, a)).mtime.getTime();
        const bTime = fs.statSync(path.join(backupDir, b)).mtime.getTime();
        return bTime - aTime; // Sort by most recent first
      });
    
    if (backups.length === 0) {
      console.log(`No backups found for ${environment} environment`);
      return;
    }
    
    console.log(`Available backups for ${environment} environment:`);
    backups.forEach((backup, index) => {
      const backupPath = path.join(backupDir, backup);
      const stats = fs.statSync(backupPath);
      const date = stats.mtime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
      
      // Check what config files are available in this backup
      const files = fs.readdirSync(backupPath);
      const configTypes = [];
      if (files.includes('app-config.json')) configTypes.push('appConfig');
      if (files.includes('api-keys.json')) configTypes.push('apiKeys');
      if (files.includes('feature-flags.json')) configTypes.push('featureFlags');
      
      console.log(`${index + 1}. ${backup} (${date}) - Contains: ${configTypes.join(', ')}`);
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    process.exit(1);
  }
}

/**
 * Create a backup of current configuration
 */
function createCurrentBackup() {
  try {
    console.log('Creating backup of current configuration...');
    
    const backupId = `pre_rollback_${new Date().toISOString().replace(/[:.]/g, '_')}`;
    const backupDir = path.join(envConfig.backupDir, backupId);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup app config
    if (fs.existsSync(envConfig.appConfig)) {
      fs.copyFileSync(envConfig.appConfig, path.join(backupDir, 'app-config.json'));
    }
    
    // Backup API keys
    if (fs.existsSync(envConfig.apiKeys)) {
      fs.copyFileSync(envConfig.apiKeys, path.join(backupDir, 'api-keys.json'));
    }
    
    // Backup feature flags
    if (fs.existsSync(envConfig.featureFlags)) {
      fs.copyFileSync(envConfig.featureFlags, path.join(backupDir, 'feature-flags.json'));
    }
    
    console.log(`Current configuration backed up to ${backupId}`);
    return backupId;
  } catch (error) {
    console.error('Error creating current backup:', error);
    process.exit(1);
  }
}

/**
 * Restore configuration from backup
 */
async function restoreFromBackup() {
  try {
    const backupDir = path.join(envConfig.backupDir, backupId);
    if (!fs.existsSync(backupDir)) {
      console.error(`Error: Backup ${backupId} does not exist`);
      process.exit(1);
    }
    
    // Check what config files are available in this backup
    const files = fs.readdirSync(backupDir);
    const availableConfigs = [];
    if (files.includes('app-config.json')) availableConfigs.push('appConfig');
    if (files.includes('api-keys.json')) availableConfigs.push('apiKeys');
    if (files.includes('feature-flags.json')) availableConfigs.push('featureFlags');
    
    if (availableConfigs.length === 0) {
      console.error(`Error: No configuration files found in backup ${backupId}`);
      process.exit(1);
    }
    
    // Determine which configs to restore
    const configsToRestore = configType === 'all' 
      ? availableConfigs 
      : availableConfigs.filter(c => c === configType);
    
    if (configsToRestore.length === 0) {
      console.error(`Error: Requested config type '${configType}' not found in backup ${backupId}`);
      process.exit(1);
    }
    
    console.log(`Restoring configuration types: ${configsToRestore.join(', ')}`);
    
    if (dryRun) {
      console.log('[DRY RUN] Would restore the following configuration files:');
      configsToRestore.forEach(config => {
        console.log(`- ${config}: ${envConfig[config]}`);
      });
      return;
    }
    
    // Confirm restore
    if (!skipConfirmation) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`Are you sure you want to restore ${configsToRestore.join(', ')} configuration from backup ${backupId}? This will overwrite current configuration. (yes/no): `, resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Configuration restore cancelled');
        return;
      }
    }
    
    // Create backup of current configuration
    createCurrentBackup();
    
    // Restore configurations
    for (const config of configsToRestore) {
      const backupFile = path.join(backupDir, config === 'appConfig' ? 'app-config.json' : 
                                          config === 'apiKeys' ? 'api-keys.json' : 
                                          'feature-flags.json');
      
      const targetFile = envConfig[config];
      
      // Ensure target directory exists
      const targetDir = path.dirname(targetFile);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy backup file to target
      fs.copyFileSync(backupFile, targetFile);
      console.log(`Restored ${config} configuration from backup`);
    }
    
    // Restart services if needed
    if (configsToRestore.length > 0 && !dryRun) {
      console.log('Configuration restored. Services may need to be restarted to apply changes.');
      
      if (process.env.AUTO_RESTART_SERVICES === 'true') {
        console.log('Auto-restarting services...');
        try {
          if (environment === 'development') {
            execSync('npm run restart:dev', { stdio: 'inherit' });
          } else if (environment === 'staging') {
            execSync('npm run restart:staging', { stdio: 'inherit' });
          } else if (environment === 'production') {
            execSync('npm run restart:prod', { stdio: 'inherit' });
          }
          console.log('Services restarted successfully');
        } catch (error) {
          console.error('Error restarting services:', error.message);
          console.log('Please restart services manually to apply configuration changes');
        }
      }
    }
    
    console.log('Configuration restore completed successfully');
  } catch (error) {
    console.error('Error restoring configuration:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  // List backups if requested
  if (args.includes('--list-backups')) {
    listBackups();
    return;
  }
  
  console.log(`Configuration Rollback - Environment: ${environment}, Backup: ${backupId}, Type: ${configType}`);
  
  if (dryRun) {
    console.log('DRY RUN MODE - No changes will be made to configuration files');
  }
  
  // Restore from backup
  await restoreFromBackup();
}

// Run the script
main().catch(console.error);