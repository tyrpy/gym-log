@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   健身日志
echo ============================================
node scripts\lan.mjs
echo   保持这个窗口开着；关闭它网站就停了。
echo ============================================
echo.
call pnpm dev
pause
