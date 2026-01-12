const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting Playwright E2E tests...');
  
  const playwrightCli = path.join(__dirname, 'node_modules', '.bin', 'playwright');
  
  execSync(`node "${playwrightCli}" test --project=chromium`, {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true
  });
  
  console.log('\n✅ Tests completed!');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}
