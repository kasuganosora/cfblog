// 响应工具测试
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse
} from '../../src/utils/response.js';
import { assert } from './test-utils.js';

export async function runResponseTests() {
  console.log('📤 运行响应工具测试...\n');

  // 测试成功响应
  await testSuccessResponse();

  // 测试错误响应
  await testErrorResponse();

  // 测试未授权响应
  await testUnauthorizedResponse();

  // 测试未找到响应
  await testNotFoundResponse();

  console.log('\n✅ 响应工具测试完成');
}

async function testSuccessResponse() {
  console.log('测试成功响应...');
  const data = { id: 1, name: 'test' };
  const message = '操作成功';

  const response = successResponse(data, message);

  assert.isTrue(response instanceof Response, '应该返回 Response 对象');
  assert.equal(response.status, 200, '状态码应该是 200');

  const body = await response.json();
  assert.isTrue(body.success, 'success 字段应该为 true');
  assert.equal(body.message, message, '消息应该正确');
  assert.deepEqual(body.data, data, '数据应该正确');

  console.log('✅ 成功响应测试通过');
}

async function testErrorResponse() {
  console.log('测试错误响应...');
  const message = '发生错误';

  const response = errorResponse(message);

  assert.isTrue(response instanceof Response, '应该返回 Response 对象');
  assert.equal(response.status, 400, '状态码应该是 400');

  const body = await response.json();
  assert.isFalse(body.success, 'success 字段应该为 false');
  assert.equal(body.message, message, '消息应该正确');

  // 测试自定义状态码
  const customResponse = errorResponse(message, 500);
  assert.equal(customResponse.status, 500, '应该支持自定义状态码');

  console.log('✅ 错误响应测试通过');
}

async function testUnauthorizedResponse() {
  console.log('测试未授权响应...');
  const message = '未授权访问';

  const response = unauthorizedResponse(message);

  assert.isTrue(response instanceof Response, '应该返回 Response 对象');
  assert.equal(response.status, 401, '状态码应该是 401');

  const body = await response.json();
  assert.isFalse(body.success, 'success 字段应该为 false');
  assert.equal(body.message, message || '未授权访问', '消息应该正确');

  console.log('✅ 未授权响应测试通过');
}

async function testNotFoundResponse() {
  console.log('测试未找到响应...');
  const message = '资源未找到';

  const response = notFoundResponse(message);

  assert.isTrue(response instanceof Response, '应该返回 Response 对象');
  assert.equal(response.status, 404, '状态码应该是 404');

  const body = await response.json();
  assert.isFalse(body.success, 'success 字段应该为 false');
  assert.equal(body.message, message || '资源未找到', '消息应该正确');

  console.log('✅ 未找到响应测试通过');
}
