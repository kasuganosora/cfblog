/**
 * Mock D1 Database for testing
 * 根据 SQL 模式匹配返回预设结果
 */

export function createMockDB(handlers = []) {
  let nextId = 1;

  function findHandler(sql, params) {
    for (const h of handlers) {
      if (typeof h.match === 'string' && sql.includes(h.match)) {
        return typeof h.result === 'function' ? h.result(sql, params) : h.result;
      }
      if (h.match instanceof RegExp && h.match.test(sql)) {
        return typeof h.result === 'function' ? h.result(sql, params) : h.result;
      }
    }
    return undefined;
  }

  return {
    prepare(sql) {
      let boundParams = [];
      return {
        bind(...params) {
          boundParams = params;
          return this;
        },
        async all() {
          const result = findHandler(sql, boundParams);
          if (Array.isArray(result)) return { results: result };
          if (result === undefined) return { results: [] };
          return { results: [result] };
        },
        async first() {
          const result = findHandler(sql, boundParams);
          if (Array.isArray(result)) return result[0] || null;
          if (result === undefined) return null;
          return result;
        },
        async run() {
          findHandler(sql, boundParams);
          return { meta: { last_row_id: nextId++ } };
        }
      };
    }
  };
}

/**
 * 创建包含标准用户数据的 mock DB
 * @param {string} adminPasswordHash - 管理员密码的 PBKDF2 hash
 * @param {object} overrides - 覆盖默认 handlers
 */
export function createStandardMockDB(adminPasswordHash, overrides = {}) {
  const adminUser = {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    password_hash: adminPasswordHash,
    display_name: 'Admin',
    role: 'admin',
    status: 1,
    created_at: '2025-01-01 00:00:00'
  };

  const normalUser = {
    id: 2,
    username: 'user',
    email: 'user@test.com',
    password_hash: adminPasswordHash,
    display_name: 'Normal User',
    role: 'member',
    status: 1,
    created_at: '2025-01-01 00:00:00'
  };

  const handlers = [
    // 用户查询
    {
      match: 'FROM users WHERE username',
      result: (sql, params) => {
        if (params[0] === 'admin') return adminUser;
        if (params[0] === 'user') return normalUser;
        return null;
      }
    },
    {
      match: 'FROM users WHERE id',
      result: (sql, params) => {
        if (params[0] === 1) return adminUser;
        if (params[0] === 2) return normalUser;
        return null;
      }
    },
    // SELECT COUNT
    { match: 'SELECT COUNT', result: [{ count: 0 }] },
    // 默认空结果
    ...(overrides.handlers || [])
  ];

  return createMockDB(handlers);
}
