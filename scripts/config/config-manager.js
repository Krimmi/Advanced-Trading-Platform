#!/usr/bin/env node
/**
 * Configuration Manager for Hedge Fund Trading Application
 * 
 * This script manages environment configurations and handles environment switching.
 * It can also validate configurations and generate environment-specific files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Define paths
const CONFIG_DIR = path.resolve(__dirname, '../../config');
const ENV_CONFIG_DIR = path.resolve(CONFIG_DIR, 'environments');
const ACTIVE_CONFIG_PATH = path.resolve(CONFIG_DIR, 'active-config.js');
const ENV_FILE_PATH = path.resolve(process.cwd(), '.env');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const environment = args[1];
const options = args.slice(2).reduce((opts, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    opts[key] = value || true;
  }
  return opts;
}, {});

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Configuration Manager for Hedge Fund Trading Application

Usage:
  node config-manager.js <command> [environment] [options]

Commands:
  list                     List available environments
  use <environment>        Switch to specified environment
  validate <environment>   Validate configuration for environment
  generate <environment>   Generate environment-specific files
  show <environment>       Show configuration for environment
  diff <env1> <env2>       Show differences between environments
  backup <environment>     Create backup of environment configuration
  restore <backup-id>      Restore configuration from backup

Environments:
  development              Development environment
  staging                  Staging environment
  production               Production environment

Options:
  --force                  Force operation without confirmation
  --output=<format>        Output format (json, table, yaml)
  --verbose                Show verbose output
  --help                   Show this help message

Examples:
  node config-manager.js list
  node config-manager.js use development
  node config-manager.js validate production
  node config-manager.js generate staging
  node config-manager.js show development --output=json
  node config-manager.js diff development production
  node config-manager.js backup production
  node config-manager.js restore backup-20230101-120000
  `);
}

/**
 * List available environments
 */
function listEnvironments() {
  try {
    const environments = fs.readdirSync(ENV_CONFIG_DIR)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));
    
    // Get current active environment
    let activeEnv = 'unknown';
    if (fs.existsSync(ACTIVE_CONFIG_PATH)) {
      const activeConfigContent = fs.readFileSync(ACTIVE_CONFIG_PATH, 'utf8');
      const match = activeConfigContent.match(/require\(['"]\.\/environments\/([^'"]+)['"]\)/);
      if (match) {
        activeEnv = match[1];
      }
    }
    
    console.log('Available environments:');
    environments.forEach(env => {
      const isActive = env === activeEnv ? '(active)' : '';
      console.log(`- ${env} ${isActive}`);
    });
    
    return environments;
  } catch (error) {
    console.error('Error listing environments:', error.message);
    process.exit(1);
  }
}

/**
 * Switch to specified environment
 */
async function useEnvironment(env) {
  try {
    // Check if environment exists
    const envPath = path.resolve(ENV_CONFIG_DIR, `${env}.js`);
    if (!fs.existsSync(envPath)) {
      console.error(`Error: Environment '${env}' does not exist`);
      process.exit(1);
    }
    
    // Confirm switch if not forced
    if (!options.force) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`Are you sure you want to switch to ${env} environment? (yes/no): `, resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Environment switch cancelled');
        return;
      }
    }
    
    // Create active-config.js file
    const configContent = `/**
 * Active Configuration for Hedge Fund Trading Application
 * 
 * This file is auto-generated. Do not modify directly.
 * Generated on: ${new Date().toISOString()}
 * Environment: ${env}
 */

module.exports = require('./environments/${env}');
`;
    
    fs.writeFileSync(ACTIVE_CONFIG_PATH, configContent);
    
    // Update .env file with environment
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      
      // Replace or add NODE_ENV
      if (envContent.includes('NODE_ENV=')) {
        envContent = envContent.replace(/NODE_ENV=.*$/m, `NODE_ENV=${env}`);
      } else {
        envContent += `\nNODE_ENV=${env}\n`;
      }
    } else {
      envContent = `NODE_ENV=${env}\n`;
    }
    
    fs.writeFileSync(ENV_FILE_PATH, envContent);
    
    console.log(`Switched to ${env} environment`);
    
    // Generate environment-specific files
    generateEnvironmentFiles(env);
  } catch (error) {
    console.error('Error switching environment:', error.message);
    process.exit(1);
  }
}

/**
 * Validate configuration for environment
 */
function validateEnvironment(env) {
  try {
    // Check if environment exists
    const envPath = path.resolve(ENV_CONFIG_DIR, `${env}.js`);
    if (!fs.existsSync(envPath)) {
      console.error(`Error: Environment '${env}' does not exist`);
      process.exit(1);
    }
    
    // Load configuration
    const config = require(envPath);
    
    // Validate required fields
    const requiredFields = [
      'server',
      'database',
      'apiServices',
      'auth',
      'logging',
      'cache',
      'webSocket',
      'featureFlags',
      'monitoring',
      'deployment'
    ];
    
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      console.error(`Error: Missing required fields in ${env} configuration: ${missingFields.join(', ')}`);
      process.exit(1);
    }
    
    // Validate sensitive fields in production
    if (env === 'production') {
      const sensitiveFields = [
        'auth.jwt.secret',
        'auth.session.secret',
        'database.mongodb.uri',
        'database.redis.password',
        'apiServices.alpaca.keyId',
        'apiServices.alpaca.secretKey',
        'apiServices.iexCloud.secretToken',
        'apiServices.polygon.apiKey',
        'apiServices.fmp.apiKey'
      ];
      
      const insecureFields = sensitiveFields.filter(field => {
        const keys = field.split('.');
        let value = config;
        for (const key of keys) {
          if (!value || !value[key]) return false;
          value = value[key];
        }
        
        // Check if value is empty or a default value
        return !value || 
               value === '' || 
               value.includes('default') || 
               value.includes('example') ||
               value.includes('change-in-production');
      });
      
      if (insecureFields.length > 0) {
        console.error(`Warning: Insecure or default values found in production configuration: ${insecureFields.join(', ')}`);
        if (!options.force) {
          process.exit(1);
        }
      }
    }
    
    // Validate environment-specific settings
    if (env === 'production') {
      // Production should have secure cookies
      if (!config.auth.session.cookie.secure) {
        console.error('Warning: Production environment should have secure cookies');
        if (!options.force) {
          process.exit(1);
        }
      }
      
      // Production should have proper logging
      if (config.logging.level !== 'info' && config.logging.level !== 'warn') {
        console.error(`Warning: Production environment should have logging level 'info' or 'warn', found '${config.logging.level}'`);
        if (!options.force) {
          process.exit(1);
        }
      }
    }
    
    console.log(`Configuration for ${env} environment is valid`);
    return true;
  } catch (error) {
    console.error('Error validating environment:', error.message);
    process.exit(1);
  }
}

/**
 * Generate environment-specific files
 */
function generateEnvironmentFiles(env) {
  try {
    // Check if environment exists
    const envPath = path.resolve(ENV_CONFIG_DIR, `${env}.js`);
    if (!fs.existsSync(envPath)) {
      console.error(`Error: Environment '${env}' does not exist`);
      process.exit(1);
    }
    
    // Load configuration
    const config = require(envPath);
    
    // Generate nginx configuration
    const nginxConfig = `# Nginx configuration for Hedge Fund Trading Application - ${env}
# Generated on: ${new Date().toISOString()}

server {
    listen 80;
    server_name ${config.deployment.domain};
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${config.deployment.domain};
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/${env}.crt;
    ssl_certificate_key /etc/nginx/ssl/${env}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # HSTS configuration
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Root directory
    root /var/www/html/${env};
    index index.html;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:${config.server.port}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:${config.server.port}/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:${config.server.port}/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }
    
    # Metrics endpoint (protected)
    location /metrics {
        proxy_pass http://localhost:${config.monitoring.prometheus?.port || 9090}/metrics;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Restrict access to internal networks
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
`;
    
    // Create nginx config directory if it doesn't exist
    const nginxDir = path.resolve(CONFIG_DIR, 'nginx');
    if (!fs.existsSync(nginxDir)) {
      fs.mkdirSync(nginxDir, { recursive: true });
    }
    
    // Write nginx config
    fs.writeFileSync(path.resolve(nginxDir, `${env}.conf`), nginxConfig);
    
    // Generate PM2 configuration
    const pm2Config = {
      apps: [
        {
          name: `hedge-fund-${env}`,
          script: 'dist/server.js',
          instances: env === 'production' ? 'max' : 1,
          exec_mode: env === 'production' ? 'cluster' : 'fork',
          watch: env === 'development',
          ignore_watch: ['node_modules', 'logs', '.git'],
          env: {
            NODE_ENV: env,
            PORT: config.server.port
          },
          log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
          error_file: `logs/${env}-error.log`,
          out_file: `logs/${env}-out.log`,
          merge_logs: true,
          max_memory_restart: env === 'production' ? '1G' : '500M'
        }
      ]
    };
    
    // Create pm2 config directory if it doesn't exist
    const pm2Dir = path.resolve(CONFIG_DIR, 'pm2');
    if (!fs.existsSync(pm2Dir)) {
      fs.mkdirSync(pm2Dir, { recursive: true });
    }
    
    // Write pm2 config
    fs.writeFileSync(
      path.resolve(pm2Dir, `${env}.json`),
      JSON.stringify(pm2Config, null, 2)
    );
    
    // Generate Docker Compose configuration
    const dockerComposeConfig = `# Docker Compose configuration for Hedge Fund Trading Application - ${env}
# Generated on: ${new Date().toISOString()}

version: '3.8'

services:
  app:
    image: hedge-fund-app:${env}
    container_name: hedge-fund-app-${env}
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: ${env}
    restart: unless-stopped
    ports:
      - "${config.server.port}:${config.server.port}"
    environment:
      - NODE_ENV=${env}
      - PORT=${config.server.port}
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    depends_on:
      - mongodb
      - redis
    networks:
      - hedge-fund-network

  mongodb:
    image: mongo:5.0
    container_name: hedge-fund-mongodb-${env}
    restart: unless-stopped
    volumes:
      - mongodb-data:/data/db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGODB_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGODB_PASSWORD}
    networks:
      - hedge-fund-network

  redis:
    image: redis:6.2-alpine
    container_name: hedge-fund-redis-${env}
    restart: unless-stopped
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    command: redis-server --requirepass \${REDIS_PASSWORD}
    networks:
      - hedge-fund-network

  nginx:
    image: nginx:1.21-alpine
    container_name: hedge-fund-nginx-${env}
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx/${env}.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
      - ./build:/var/www/html/${env}
    depends_on:
      - app
    networks:
      - hedge-fund-network

${env === 'production' || env === 'staging' ? `
  prometheus:
    image: prom/prometheus:v2.37.0
    container_name: hedge-fund-prometheus-${env}
    restart: unless-stopped
    volumes:
      - ./config/prometheus/${env}.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "${config.monitoring.prometheus?.port || 9090}:9090"
    networks:
      - hedge-fund-network

  grafana:
    image: grafana/grafana:9.0.0
    container_name: hedge-fund-grafana-${env}
    restart: unless-stopped
    volumes:
      - grafana-data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD}
    depends_on:
      - prometheus
    networks:
      - hedge-fund-network
` : ''}

networks:
  hedge-fund-network:
    driver: bridge

volumes:
  mongodb-data:
  redis-data:
${env === 'production' || env === 'staging' ? `  prometheus-data:
  grafana-data:` : ''}
`;
    
    // Create docker-compose directory if it doesn't exist
    const dockerDir = path.resolve(CONFIG_DIR, 'docker');
    if (!fs.existsSync(dockerDir)) {
      fs.mkdirSync(dockerDir, { recursive: true });
    }
    
    // Write docker-compose config
    fs.writeFileSync(
      path.resolve(dockerDir, `docker-compose.${env}.yml`),
      dockerComposeConfig
    );
    
    console.log(`Generated environment-specific files for ${env} environment:`);
    console.log(`- Nginx configuration: config/nginx/${env}.conf`);
    console.log(`- PM2 configuration: config/pm2/${env}.json`);
    console.log(`- Docker Compose configuration: config/docker/docker-compose.${env}.yml`);
  } catch (error) {
    console.error('Error generating environment files:', error.message);
    process.exit(1);
  }
}

/**
 * Show configuration for environment
 */
function showEnvironment(env) {
  try {
    // Check if environment exists
    const envPath = path.resolve(ENV_CONFIG_DIR, `${env}.js`);
    if (!fs.existsSync(envPath)) {
      console.error(`Error: Environment '${env}' does not exist`);
      process.exit(1);
    }
    
    // Load configuration
    const config = require(envPath);
    
    // Determine output format
    const format = options.output || 'table';
    
    if (format === 'json') {
      console.log(JSON.stringify(config, null, 2));
    } else if (format === 'yaml') {
      try {
        const yaml = require('js-yaml');
        console.log(yaml.dump(config));
      } catch (error) {
        console.error('Error: js-yaml package is required for YAML output. Install it with: npm install js-yaml');
        process.exit(1);
      }
    } else {
      // Default to table format
      console.log(`Configuration for ${env} environment:`);
      
      // Helper function to print nested objects
      function printObject(obj, indent = 0) {
        for (const [key, value] of Object.entries(obj)) {
          const indentStr = ' '.repeat(indent);
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            console.log(`${indentStr}${key}:`);
            printObject(value, indent + 2);
          } else if (Array.isArray(value)) {
            console.log(`${indentStr}${key}: [${value.join(', ')}]`);
          } else {
            // Mask sensitive values
            const sensitiveKeys = ['secret', 'password', 'key', 'token'];
            const isSensitive = sensitiveKeys.some(sk => key.toLowerCase().includes(sk));
            
            const displayValue = isSensitive && typeof value === 'string' && value.length > 0
              ? '********'
              : value;
            
            console.log(`${indentStr}${key}: ${displayValue}`);
          }
        }
      }
      
      printObject(config);
    }
  } catch (error) {
    console.error('Error showing environment:', error.message);
    process.exit(1);
  }
}

/**
 * Show differences between environments
 */
function diffEnvironments(env1, env2) {
  try {
    // Check if environments exist
    const env1Path = path.resolve(ENV_CONFIG_DIR, `${env1}.js`);
    const env2Path = path.resolve(ENV_CONFIG_DIR, `${env2}.js`);
    
    if (!fs.existsSync(env1Path)) {
      console.error(`Error: Environment '${env1}' does not exist`);
      process.exit(1);
    }
    
    if (!fs.existsSync(env2Path)) {
      console.error(`Error: Environment '${env2}' does not exist`);
      process.exit(1);
    }
    
    // Load configurations
    const config1 = require(env1Path);
    const config2 = require(env2Path);
    
    // Helper function to find differences
    function findDifferences(obj1, obj2, path = '') {
      const differences = [];
      
      // Get all keys from both objects
      const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      
      for (const key of keys) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Key exists only in obj1
        if (!(key in obj2)) {
          differences.push({
            path: currentPath,
            [env1]: obj1[key],
            [env2]: 'undefined'
          });
          continue;
        }
        
        // Key exists only in obj2
        if (!(key in obj1)) {
          differences.push({
            path: currentPath,
            [env1]: 'undefined',
            [env2]: obj2[key]
          });
          continue;
        }
        
        const val1 = obj1[key];
        const val2 = obj2[key];
        
        // Both values are objects
        if (typeof val1 === 'object' && val1 !== null && !Array.isArray(val1) &&
            typeof val2 === 'object' && val2 !== null && !Array.isArray(val2)) {
          differences.push(...findDifferences(val1, val2, currentPath));
          continue;
        }
        
        // Values are different
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push({
            path: currentPath,
            [env1]: val1,
            [env2]: val2
          });
        }
      }
      
      return differences;
    }
    
    // Find differences
    const differences = findDifferences(config1, config2);
    
    if (differences.length === 0) {
      console.log(`No differences found between ${env1} and ${env2} environments`);
      return;
    }
    
    console.log(`Differences between ${env1} and ${env2} environments:`);
    
    // Determine output format
    const format = options.output || 'table';
    
    if (format === 'json') {
      console.log(JSON.stringify(differences, null, 2));
    } else if (format === 'yaml') {
      try {
        const yaml = require('js-yaml');
        console.log(yaml.dump(differences));
      } catch (error) {
        console.error('Error: js-yaml package is required for YAML output. Install it with: npm install js-yaml');
        process.exit(1);
      }
    } else {
      // Default to table format
      differences.forEach(diff => {
        console.log(`\nPath: ${diff.path}`);
        
        // Mask sensitive values
        const sensitiveKeys = ['secret', 'password', 'key', 'token'];
        const isSensitive = sensitiveKeys.some(sk => diff.path.toLowerCase().includes(sk));
        
        const displayValue1 = isSensitive && typeof diff[env1] === 'string' && diff[env1].length > 0
          ? '********'
          : diff[env1];
        
        const displayValue2 = isSensitive && typeof diff[env2] === 'string' && diff[env2].length > 0
          ? '********'
          : diff[env2];
        
        console.log(`${env1}: ${displayValue1}`);
        console.log(`${env2}: ${displayValue2}`);
      });
    }
  } catch (error) {
    console.error('Error comparing environments:', error.message);
    process.exit(1);
  }
}

/**
 * Create backup of environment configuration
 */
function backupEnvironment(env) {
  try {
    // Check if environment exists
    const envPath = path.resolve(ENV_CONFIG_DIR, `${env}.js`);
    if (!fs.existsSync(envPath)) {
      console.error(`Error: Environment '${env}' does not exist`);
      process.exit(1);
    }
    
    // Create backup directory if it doesn't exist
    const backupDir = path.resolve(CONFIG_DIR, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create backup ID
    const backupId = `${env}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.resolve(backupDir, backupId);
    fs.mkdirSync(backupPath);
    
    // Copy environment file
    fs.copyFileSync(envPath, path.resolve(backupPath, `${env}.js`));
    
    // Copy related files
    const relatedFiles = [
      { dir: 'nginx', file: `${env}.conf` },
      { dir: 'pm2', file: `${env}.json` },
      { dir: 'docker', file: `docker-compose.${env}.yml` }
    ];
    
    relatedFiles.forEach(({ dir, file }) => {
      const filePath = path.resolve(CONFIG_DIR, dir, file);
      if (fs.existsSync(filePath)) {
        // Create directory if it doesn't exist
        const targetDir = path.resolve(backupPath, dir);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.copyFileSync(filePath, path.resolve(targetDir, file));
      }
    });
    
    // Create metadata file
    const metadata = {
      environment: env,
      timestamp: new Date().toISOString(),
      files: [
        `${env}.js`,
        ...relatedFiles
          .filter(({ dir, file }) => fs.existsSync(path.resolve(CONFIG_DIR, dir, file)))
          .map(({ dir, file }) => `${dir}/${file}`)
      ]
    };
    
    fs.writeFileSync(
      path.resolve(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`Created backup of ${env} environment: ${backupId}`);
    return backupId;
  } catch (error) {
    console.error('Error backing up environment:', error.message);
    process.exit(1);
  }
}

/**
 * Restore configuration from backup
 */
async function restoreBackup(backupId) {
  try {
    // Check if backup exists
    const backupPath = path.resolve(CONFIG_DIR, 'backups', backupId);
    if (!fs.existsSync(backupPath)) {
      console.error(`Error: Backup '${backupId}' does not exist`);
      process.exit(1);
    }
    
    // Load metadata
    const metadataPath = path.resolve(backupPath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.error(`Error: Backup '${backupId}' is missing metadata file`);
      process.exit(1);
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const env = metadata.environment;
    
    // Confirm restore if not forced
    if (!options.force) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`Are you sure you want to restore ${env} environment from backup ${backupId}? This will overwrite current configuration. (yes/no): `, resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore cancelled');
        return;
      }
    }
    
    // Backup current configuration before restore
    console.log('Creating backup of current configuration before restore...');
    backupEnvironment(env);
    
    // Restore environment file
    const envFile = `${env}.js`;
    const sourceEnvPath = path.resolve(backupPath, envFile);
    const targetEnvPath = path.resolve(ENV_CONFIG_DIR, envFile);
    
    if (fs.existsSync(sourceEnvPath)) {
      fs.copyFileSync(sourceEnvPath, targetEnvPath);
      console.log(`Restored ${envFile}`);
    } else {
      console.error(`Warning: Environment file ${envFile} not found in backup`);
    }
    
    // Restore related files
    metadata.files.forEach(file => {
      if (file === envFile) return; // Already handled
      
      const sourcePath = path.resolve(backupPath, file);
      const targetPath = path.resolve(CONFIG_DIR, file);
      
      if (fs.existsSync(sourcePath)) {
        // Create directory if it doesn't exist
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Restored ${file}`);
      } else {
        console.error(`Warning: File ${file} not found in backup`);
      }
    });
    
    console.log(`Successfully restored ${env} environment from backup ${backupId}`);
    
    // Switch to restored environment
    useEnvironment(env);
  } catch (error) {
    console.error('Error restoring backup:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  // Show help if requested or no command provided
  if (!command || command === 'help' || options.help) {
    showHelp();
    return;
  }
  
  // Execute command
  switch (command) {
    case 'list':
      listEnvironments();
      break;
    case 'use':
      if (!environment) {
        console.error('Error: Environment is required for "use" command');
        process.exit(1);
      }
      await useEnvironment(environment);
      break;
    case 'validate':
      if (!environment) {
        console.error('Error: Environment is required for "validate" command');
        process.exit(1);
      }
      validateEnvironment(environment);
      break;
    case 'generate':
      if (!environment) {
        console.error('Error: Environment is required for "generate" command');
        process.exit(1);
      }
      generateEnvironmentFiles(environment);
      break;
    case 'show':
      if (!environment) {
        console.error('Error: Environment is required for "show" command');
        process.exit(1);
      }
      showEnvironment(environment);
      break;
    case 'diff':
      if (!environment || !args[2]) {
        console.error('Error: Two environments are required for "diff" command');
        process.exit(1);
      }
      diffEnvironments(environment, args[2]);
      break;
    case 'backup':
      if (!environment) {
        console.error('Error: Environment is required for "backup" command');
        process.exit(1);
      }
      backupEnvironment(environment);
      break;
    case 'restore':
      if (!environment) {
        console.error('Error: Backup ID is required for "restore" command');
        process.exit(1);
      }
      await restoreBackup(environment);
      break;
    default:
      console.error(`Error: Unknown command "${command}"`);
      showHelp();
      process.exit(1);
  }
}

// Run the script
main().catch(console.error);