// 单元测试运行器
import { TestRunner } from './test-utils.js';
import { runAuthTests } from './simple-auth.test.js';
import { runResponseTests } from './simple-response.test.js';

async function main() {
  console.log('🧪 开始运行单元测试...\n');

  // 添加所有测试
  await runAuthTests();
  await runResponseTests();

  console.log('\n🎉 所有单元测试通过！');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});
