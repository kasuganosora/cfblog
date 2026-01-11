@echo off
echo Testing Frontend Pages...
node tests/test-frontend-pages-with-server.mjs
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%
