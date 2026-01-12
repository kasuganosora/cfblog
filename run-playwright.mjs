import { spawn } from 'child_process';

const testArgs = [
  'test',
  '--project=chromium',
  '--reporter=list'
];

console.log('Running Playwright E2E tests...');

const playwright = spawn('npx', ['playwright', ...testArgs], {
  cwd: process.cwd(),
  shell: true,
  stdio: 'inherit'
});

playwright.on('close', (code) => {
  console.log(`\nTests exited with code ${code}`);
  process.exit(code || 0);
});

playwright.on('error', (err) => {
  console.error('Error running tests:', err);
  process.exit(1);
});
