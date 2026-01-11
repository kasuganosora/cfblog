// 直接运行单元测试
import('./tests/unit/run-tests.js').catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
