@echo off
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  start "" http://localhost:4173
  node server.mjs
  exit /b
)
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
  start "" http://localhost:4173
  "%USERPROFILE%\.bun\bin\bun.exe" server.mjs
  exit /b
)
echo Instale Node.js ou execute: python -m http.server 4173
pause
