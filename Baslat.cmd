@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Kurulum gerektirmeyen onizleme aciliyor.
  start "" "%~dp0release\Onizleme.html"
  echo Tam surum icin https://nodejs.org adresinden Node.js LTS kurun.
  pause
  exit /b 1
)
node scripts\start-local.mjs
pause
