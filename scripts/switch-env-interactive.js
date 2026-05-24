const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔀 Switch Environment\n');
console.log('1. Local (localhost:3000)');
console.log('2. Production (Render)\n');

rl.question('Choose environment (1 or 2): ', (answer) => {
  let sourceFile, envName;
  
  if (answer === '1') {
    sourceFile = '.env.development';
    envName = 'LOCAL';
  } else if (answer === '2') {
    sourceFile = '.env.production';
    envName = 'PRODUCTION';
  } else {
    console.log('❌ Invalid choice');
    rl.close();
    return;
  }
  
  fs.copyFileSync(
    path.join(__dirname, '..', sourceFile),
    path.join(__dirname, '..', '.env.local')
  );
  
  console.log(`\n✅ Environment switched to ${envName}`);
  console.log(`   Source: ${sourceFile}\n`);
  
  rl.close();
});
