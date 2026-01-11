// 集成测试运行器
import { APITestRunner } from './api.test.js';

async function main() {
  try {
    const runner = new APITestRunner();
    await runner.run();
  } catch (error) {
    console.error('测试运行失败:', error);
    process.exit(1);
  }
}

main();
