@echo off
echo Starting Playwright E2E tests...
cd /d "d:\code\cfblog"
npx playwright test --project=chromium
echo Tests completed.
