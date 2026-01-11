// 直接导入并运行前台测试
import('./tests/test-frontend-pages.mjs').catch(error => {
  console.error('Error running frontend tests:', error);
  process.exit(1);
});
