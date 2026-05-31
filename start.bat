@echo off
cd /d "%~dp0"
echo === 三角洲行动 · 交易助手 ===
echo.
echo 拉取最新数据...
git pull --no-edit 2>nul
echo.
echo 启动中... http://localhost:3000
echo 按 Ctrl+C 停止服务器
start http://localhost:3000
npx serve . -p 3000 --no-clipboard
pause
