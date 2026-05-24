const fs = require('fs');
const path = require('path');

const env = process.argv[2];

if (!env || !['local', 'prod'].includes(env)) {
  console.log('Usage: node scripts/switch-env.js [local|prod]');
  process.exit(1);
}

const sourceFile = env === 'local' ? '.env.development' : '.env.production';
const targetFile = '.env.local';

fs.copyFileSync(path.join(__dirname, '..', sourceFile), path.join(__dirname, '..', targetFile));
console.log(`✅ Environment switched to ${env} (${sourceFile} → ${targetFile})`);
