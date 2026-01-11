@echo off
REM Windows 批处理文件 - 用于执行 Node.js 脚本
REM 解决 PowerShell 执行 node 命令的限制
cd /d d:\code\cfblog
node %*
