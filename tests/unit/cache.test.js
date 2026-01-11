// 缓存工具测试
import { getCachedData, setCachedData, deleteCachedData } from '../../src/utils/cache.js';
import { mock, assert } from './test-utils.js';

export async function runCacheTests() {
  console.log('💾 运行缓存工具测试...\n');

  const env = mock.env();

  // 测试获取缓存
  await testGetCache(env);

  // 测试设置缓存
  await testSetCache(env);

  // 测试删除缓存
  await testDeleteCache(env);

  console.log('\n✅ 缓存工具测试完成');
}

async function testGetCache(env) {
  console.log('测试获取缓存...');

  // 模拟缓存未命中
  env.CACHE.get = () => Promise.resolve(null);
  const result1 = await getCachedData(env, 'test-key');
  assert.isNull(result1, '缓存未命中时应该返回 null');

  // 模拟缓存命中
  const mockData = JSON.stringify({ id: 1, name: 'test' });
  env.CACHE.get = () => Promise.resolve(mockData);
  const result2 = await getCachedData(env, 'test-key');
  assert.isNotNull(result2, '缓存命中时应该返回数据');
  assert.equal(result2.id, 1, '返回的数据应该正确');

  console.log('✅ 获取缓存测试通过');
}

async function testSetCache(env) {
  console.log('测试设置缓存...');

  let cachedData = null;
  let cachedKey = null;

  env.CACHE.put = (key, data, options) => {
    cachedKey = key;
    cachedData = data;
    return Promise.resolve();
  };

  const testData = { id: 1, name: 'test' };
  await setCachedData(env, 'test-key', testData, 300);

  assert.equal(cachedKey, 'test-key', '缓存键应该正确');
  assert.isDefined(cachedData, '缓存数据应该被设置');

  // 验证缓存的过期时间
  assert.isTrue(typeof options === 'object', '应该设置缓存选项');

  console.log('✅ 设置缓存测试通过');
}

async function testDeleteCache(env) {
  console.log('测试删除缓存...');

  let deletedKey = null;

  env.CACHE.delete = (key) => {
    deletedKey = key;
    return Promise.resolve();
  };

  await deleteCachedData(env, 'test-key');

  assert.equal(deletedKey, 'test-key', '删除的键应该正确');

  console.log('✅ 删除缓存测试通过');
}
