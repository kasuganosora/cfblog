// 前端测试综合运行器
import('./test-frontend-pages.mjs').then(async () => {
  console.log('\n✅ 前台页面测试完成\n');
}).catch(error => {
  console.error('\n❌ 前台页面测试失败:', error.message);
  process.exit(1);
});

import('./test-admin-pages.mjs').then(async () => {
  console.log('\n✅ 后台页面测试完成\n');
}).catch(error => {
  console.error('\n❌ 后台页面测试失败:', error.message);
  process.exit(1);
});
