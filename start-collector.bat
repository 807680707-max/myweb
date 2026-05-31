@echo off
cd /d "%~dp0"
echo === 三角洲行动 · 后台采集器 ===
echo 窗口开着就在后台自动采集，关闭即停止
echo.
REM 把下面这行的 YOUR_KEY_HERE 替换成你的 API Key
set DF_API_KEY=YOUR_KEY_HERE
node collector.js
pause
