@echo off
setlocal
cd /d "%~dp0"
title VideoMind Batch

echo VideoMind will open Douyin and Doubao automatically if needed.
echo.

set /p VM_BATCH=How many unfinished videos this run? [default 50]: 
if "%VM_BATCH%"=="" set "VM_BATCH=50"

node.exe scripts\run-batch.mjs "%VM_BATCH%"
if errorlevel 1 goto :failed

echo.
echo ========================================
echo Batch completed successfully.
echo Progress was saved and will be skipped next time.
echo ========================================
pause
exit /b 0

:failed
echo.
echo This batch stopped with an error.
echo Completed work remains saved and can resume next time.
pause
exit /b 1
