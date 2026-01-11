// 运行所有测试
console.log('🧪 开始运行所有测试...\n');

// 1. 运行单元测试 - 认证工具
console.log('=== 运行认证工具测试 ===');
await import('./simple-auth-test.mjs').catch(error => {
  console.error('❌ 认证测试失败:', error.message);
});

// 2. 运行单元测试 - 响应工具
console.log('\n=== 运行响应工具测试 ===');
await import('./simple-response-test.mjs').catch(error => {
  console.error('❌ 响应测试失败:', error.message);
});

console.log('\n🎉 所有测试完成！');
