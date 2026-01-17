/**
 * Server Check - 检查和启动本地服务器
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ServerCheck {
  constructor(host = 'localhost', port = 8787) {
    this.host = host;
    this.port = port;
    this.serverProcess = null;
    this.serverReadyTimeout = 30000; // 30秒超时
  }

  /**
   * 检查服务器是否运行
   */
  async isServerRunning() {
    return new Promise((resolve) => {
      const req = http.get(`http://${this.host}:${this.port}`, (res) => {
        resolve(true);
        req.destroy();
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * 等待服务器就绪
   */
  async waitForServer() {
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.serverReadyTimeout) {
      const isRunning = await this.isServerRunning();
      if (isRunning) {
        console.log('✅ Server is ready!');
        return true;
      }
      await this.sleep(1000);
    }
    
    return false;
  }

  /**
   * 启动本地服务器
   */
  async startServer() {
    console.log('🚀 Starting local development server...');
    
    const logDir = path.join(process.cwd(), 'test-results', 'server-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const outLog = fs.openSync(path.join(logDir, 'server-out.log'), 'w');
    const errLog = fs.openSync(path.join(logDir, 'server-err.log'), 'w');

    this.serverProcess = spawn('node', ['start-dev.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', outLog, errLog]
    });

    console.log('  Process started, waiting for server to be ready...');
    console.log(`  Logs: ${logDir}/server-*.log`);

    const isReady = await this.waitForServer();
    
    if (!isReady) {
      console.error('❌ Server failed to start within timeout');
      await this.stopServer();
      throw new Error('Server failed to start');
    }
  }

  /**
   * 停止服务器
   */
  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping server...');
      this.serverProcess.kill('SIGTERM');
      
      // 等待进程退出
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (!this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.serverProcess.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.serverProcess = null;
      console.log('✅ Server stopped');
    }
  }

  /**
   * 确保服务器正在运行
   */
  async ensureServer() {
    const isRunning = await this.isServerRunning();
    
    if (isRunning) {
      console.log('✅ Server is already running');
      return;
    }

    console.log('⚠️  Server is not running, starting it now...');
    await this.startServer();
  }

  /**
   * 辅助方法：休眠
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ServerCheck;
