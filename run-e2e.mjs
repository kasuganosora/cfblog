#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting E2E tests...');

const playwright = join(__dirname, 'node_modules', '@playwright', 'test', 'cli.js');

const testProcess = spawn('node', [playwright, 'test', '--project=chromium'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
  process.exit(code);
});

testProcess.on('error', (err) => {
  console.error('Failed to start test process:', err);
  process.exit(1);
});
