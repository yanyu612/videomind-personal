@echo off
setlocal
cd /d "%~dp0"
title VideoMind Clear Cache

echo ========================================
echo This clears processed-video history and temporary analysis results.
echo Obsidian knowledge notes will NOT be deleted.
echo Please close any running VideoMind batch first.
echo No local cache backup will be created; Obsidian is the durable record.
echo ========================================
echo.
choice /C YN /N /M "Continue? [Y/N]: "
if errorlevel 2 exit /b 0

node.exe scripts\clear-cache.mjs
if errorlevel 1 goto :failed

echo.
echo Cache cleared successfully.
pause
exit /b 0

:failed
echo.
echo Cache clearing failed. Nothing else was deleted.
pause
exit /b 1
