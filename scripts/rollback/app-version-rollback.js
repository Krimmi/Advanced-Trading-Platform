/**
 * Application Version Rollback Script for Hedge Fund Trading Application
 * 
 * This script provides rollback capabilities for application code versions
 * It can restore previous versions from Git tags or specific commits
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
const version = args.find(arg => arg.startsWith('--version='))?.split('=')[1];
const commit = args.find(arg => arg.startsWith('--commit='))?.split('=')[1];
const tag = args.find(arg => arg.startsWith('--tag='))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const skipBuild = args.includes('--skip-build');
const skipDeploy = args.includes('--skip-deploy');
const skipConfirmation = args.includes('--skip-confirmation');

// Validate inputs
if (!['development', 'staging', 'production'].includes(environment)) {
  console.error('Error: Environment must be one of: development, staging, production');
  process.exit(1);
}

if (!version && !commit && !tag && !args.includes('--list-versions')) {
  console.error('Error: Either version, commit, or tag is required (--version=X.Y.Z or --commit=HASH or --tag=TAG_NAME) or use --list-versions to see available versions');
  process.exit(1);
}

/**
 * Execute shell command and return output
 */
function execCommand(command, silent = false) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    if (!silent) {
      console.error(`Error executing command: ${command}`);
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * List available versions
 */
function listVersions() {
  try {
    console.log('Available versions:');
    
    // List tags
    console.log('\nTags:');
    const tags = execCommand('git tag --sort=-creatordate', true).trim().split('\n');
    tags.slice(0, 20).forEach(tag => {
      const date = execCommand(`git log -1 --format=%cd --date=short ${tag}`, true).trim();
      console.log(`- ${tag} (${date})`);
    });
    
    // List recent commits
    console.log('\nRecent commits:');
    const commits = execCommand('git log --oneline -n 20', true).trim().split('\n');
    commits.forEach(commit => {
      console.log(`- ${commit}`);
    });
    
    // List deployment versions
    console.log('\nDeployment versions:');
    try {
      const deploymentDir = './deployments';
      if (fs.existsSync(deploymentDir)) {
        const deployments = fs.readdirSync(deploymentDir)
          .filter(file => file.startsWith(environment))
          .sort((a, b) => {
            const aTime = fs.statSync(path.join(deploymentDir, a)).mtime.getTime();
            const bTime = fs.statSync(path.join(deploymentDir, b)).mtime.getTime();
            return bTime - aTime; // Sort by most recent first
          });
        
        deployments.slice(0, 10).forEach(deployment => {
          const deploymentPath = path.join(deploymentDir, deployment);
          const stats = fs.statSync(deploymentPath);
          const date = stats.mtime.toISOString().replace(/T/, ' ').replace(/\..+/, '');
          console.log(`- ${deployment} (${date})`);
        });
      } else {
        console.log('No deployment records found');
      }
    } catch (error) {
      console.log('No deployment records found');
    }
  } catch (error) {
    console.error('Error listing versions:', error.message);
    process.exit(1);
  }
}

/**
 * Check if working directory is clean
 */
function isWorkingDirectoryClean() {
  try {
    const status = execCommand('git status --porcelain', true);
    return status.trim() === '';
  } catch (error) {
    return false;
  }
}

/**
 * Create backup of current state
 */
function createBackup() {
  try {
    console.log('Creating backup of current state...');
    
    // Create backup branch
    const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD', true).trim();
    const backupBranch = `backup/${environment}_${new Date().toISOString().replace(/[:.]/g, '_')}`;
    
    execCommand(`git checkout -b ${backupBranch}`, true);
    execCommand(`git add .`, true);
    execCommand(`git commit -m "Backup before rollback to ${version || commit || tag}"`, true);
    execCommand(`git checkout ${currentBranch}`, true);
    
    console.log(`Current state backed up to branch: ${backupBranch}`);
    return backupBranch;
  } catch (error) {
    console.error('Error creating backup:', error.message);
    return null;
  }
}

/**
 * Rollback to specific version
 */
async function rollbackToVersion() {
  try {
    console.log(`Application Version Rollback - Environment: ${environment}, Target: ${version || commit || tag}`);
    
    if (dryRun) {
      console.log('DRY RUN MODE - No changes will be made to the codebase');
    }
    
    // Check if working directory is clean
    if (!isWorkingDirectoryClean()) {
      console.error('Error: Working directory is not clean. Please commit or stash your changes before rollback.');
      process.exit(1);
    }
    
    // Determine target reference
    let targetRef;
    if (version) {
      // Look for tag with this version
      try {
        const tags = execCommand(`git tag -l "v${version}" "v${version}.*"`, true).trim().split('\n');
        if (tags.length > 0 && tags[0]) {
          targetRef = tags[0];
          console.log(`Found tag for version ${version}: ${targetRef}`);
        } else {
          console.error(`Error: No tag found for version ${version}`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error: Failed to find tag for version ${version}`);
        process.exit(1);
      }
    } else if (tag) {
      // Use provided tag
      targetRef = tag;
    } else if (commit) {
      // Use provided commit
      targetRef = commit;
    }
    
    // Confirm rollback
    if (!skipConfirmation && !dryRun) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`Are you sure you want to rollback to ${targetRef} for ${environment} environment? This will reset your working directory. (yes/no): `, resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Rollback cancelled');
        return;
      }
    }
    
    // Create backup
    if (!dryRun) {
      const backupBranch = createBackup();
      if (backupBranch) {
        console.log(`Created backup branch: ${backupBranch}`);
      }
    }
    
    if (dryRun) {
      console.log(`[DRY RUN] Would rollback to: ${targetRef}`);
      return;
    }
    
    // Fetch latest changes
    console.log('Fetching latest changes...');
    execCommand('git fetch --all --tags');
    
    // Checkout target version
    console.log(`Checking out ${targetRef}...`);
    execCommand(`git checkout ${targetRef}`);
    
    // Install dependencies
    if (!skipBuild) {
      console.log('Installing dependencies...');
      execCommand('npm ci');
      
      // Build application
      console.log('Building application...');
      execCommand(`npm run build:${environment}`);
    }
    
    // Deploy if needed
    if (!skipDeploy) {
      console.log(`Deploying to ${environment}...`);
      execCommand(`npm run deploy:${environment}`);
    }
    
    // Record deployment
    const deploymentDir = './deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentDir, `${environment}_${targetRef}_${new Date().toISOString().replace(/[:.]/g, '_')}`);
    fs.writeFileSync(deploymentFile, JSON.stringify({
      environment,
      targetRef,
      timestamp: new Date().toISOString(),
      commit: execCommand('git rev-parse HEAD', true).trim()
    }, null, 2));
    
    console.log(`Application successfully rolled back to ${targetRef} for ${environment} environment`);
  } catch (error) {
    console.error('Error during rollback:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  // List versions if requested
  if (args.includes('--list-versions')) {
    listVersions();
    return;
  }
  
  // Rollback to specific version
  await rollbackToVersion();
}

// Run the script
main().catch(console.error);