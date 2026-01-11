// 简化的响应工具测试
import { assert } from './test-utils.js';

// 成功响应
function successResponse(data, message = 'Success') {
  return {
    status: 200,
    body: JSON.stringify({
      success: true,
      message,
      data
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

// 错误响应
function errorResponse(message, status = 400) {
  return {
    status,
    body: JSON.stringify({
      success: false,
      message,
      data: null
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

// 未授权响应
function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

// 未找到响应
function notFoundResponse(message = 'Not Found') {
  return errorResponse(message, 404);
}

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

  assert.equal(response.status, 200, '状态码应该是 200');
  assert.equal(response.headers['Content-Type'], 'application/json', 'Content-Type 应该正确');

  const body = JSON.parse(response.body);
  assert.isTrue(body.success, 'success 字段应该为 true');
  assert.equal(body.message, message, '消息应该正确');
  assert.deepEqual(body.data, data, '数据应该正确');

  console.log('✅ 成功响应测试通过');
}

async function testErrorResponse() {
  console.log('测试错误响应...');
  const message = '发生错误';

  const response = errorResponse(message);

  assert.equal(response.status, 400, '状态码应该是 400');
  assert.equal(response.headers['Content-Type'], 'application/json', 'Content-Type 应该正确');

  const body = JSON.parse(response.body);
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

  assert.equal(response.status, 401, '状态码应该是 401');

  const body = JSON.parse(response.body);
  assert.isFalse(body.success, 'success 字段应该为 false');
  assert.equal(body.message, message || 'Unauthorized', '消息应该正确');

  console.log('✅ 未授权响应测试通过');
}

async function testNotFoundResponse() {
  console.log('测试未找到响应...');
  const message = '资源未找到';

  const response = notFoundResponse(message);

  assert.equal(response.status, 404, '状态码应该是 404');

  const body = JSON.parse(response.body);
  assert.isFalse(body.success, 'success 字段应该为 false');
  assert.equal(body.message, message || 'Not Found', '消息应该正确');

  console.log('✅ 未找到响应测试通过');
}
