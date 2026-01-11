@echo off
echo Waiting for server to start...
ping 127.0.0.1 -n 6 > nul
echo Testing server connection...
curl -s http://localhost:8787/ > nul
if %ERRORLEVEL% EQU 0 (
  echo Server is running!
) else (
  echo Server not responding
)
