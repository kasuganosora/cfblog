@echo off
cd /d d:\code\cfblog
echo Testing frontend pages...
powershell -Command "node tests/test-frontend-pages.mjs"
