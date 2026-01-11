// 单元测试工具类
export class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  skip(name, fn) {
    this.tests.push({ name, fn, skip: true });
  }

  async run() {
    console.log('🧪 开始运行单元测试...\n');

    for (const test of this.tests) {
      if (test.skip) {
        console.log(`⏭️  跳过: ${test.name}`);
        this.results.skipped++;
        continue;
      }

      try {
        await test.fn();
        console.log(`✅ 通过: ${test.name}`);
        this.results.passed++;
      } catch (error) {
        console.error(`❌ 失败: ${test.name}`);
        console.error(`   ${error.message}`);
        this.results.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 测试总结:');
    console.log(`   ✅ 通过: ${this.results.passed}`);
    console.log(`   ❌ 失败: ${this.results.failed}`);
    console.log(`   ⏭️  跳过: ${this.results.skipped}`);
    console.log(`   📈 总计: ${this.tests.length}`);

    if (this.results.failed === 0) {
      console.log('\n🎉 所有测试通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️  有测试失败！');
      process.exit(1);
    }
  }
}

// 断言函数
export const assert = {
  equal(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`断言失败: ${message}\n   期望: ${expected}\n   实际: ${actual}`);
    }
  },

  notEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(`断言失败: ${message}\n   期望不等于: ${expected}\n   实际: ${actual}`);
    }
  },

  deepEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`断言失败: ${message}\n   期望: ${expectedStr}\n   实际: ${actualStr}`);
    }
  },

  isTrue(value, message = '') {
    if (!value) {
      throw new Error(`断言失败: ${message}\n   期望为真，实际为: ${value}`);
    }
  },

  isFalse(value, message = '') {
    if (value) {
      throw new Error(`断言失败: ${message}\n   期望为假，实际为: ${value}`);
    }
  },

  isNull(value, message = '') {
    if (value !== null) {
      throw new Error(`断言失败: ${message}\n   期望为 null，实际为: ${value}`);
    }
  },

  isNotNull(value, message = '') {
    if (value === null) {
      throw new Error(`断言失败: ${message}\n   期望不为 null`);
    }
  },

  isUndefined(value, message = '') {
    if (value !== undefined) {
      throw new Error(`断言失败: ${message}\n   期望为 undefined，实际为: ${value}`);
    }
  },

  isDefined(value, message = '') {
    if (value === undefined) {
      throw new Error(`断言失败: ${message}\n   期望不为 undefined`);
    }
  },

  throws(fn, message = '') {
    try {
      fn();
      throw new Error(`断言失败: ${message}\n   期望函数抛出异常`);
    } catch (error) {
      if (error.message.includes('断言失败')) {
        throw error; // 重新抛出断言错误
      }
      // 函数抛出了异常，这是期望的行为
    }
  },

  doesNotThrow(fn, message = '') {
    try {
      fn();
    } catch (error) {
      throw new Error(`断言失败: ${message}\n   函数抛出了异常: ${error.message}`);
    }
  },

  contains(haystack, needle, message = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`断言失败: ${message}\n   "${haystack}" 不包含 "${needle}"`);
    }
  },

  length(array, expected, message = '') {
    if (array.length !== expected) {
      throw new Error(`断言失败: ${message}\n   期望长度: ${expected}\n   实际长度: ${array.length}`);
    }
  }
};

// Mock 对象创建器
export const mock = {
  env() {
    return {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: () => Promise.resolve({ results: [] }),
            first: () => Promise.resolve(null),
            run: () => Promise.resolve({ changes: 0, meta: { last_row_id: 1 } })
          }),
          all: () => Promise.resolve({ results: [] }),
          first: () => Promise.resolve(null),
          run: () => Promise.resolve({ changes: 0, meta: { last_row_id: 1 } })
        })
      },
      BLOG_STORAGE: {},
      CACHE: {
        get: () => Promise.resolve(null),
        put: () => Promise.resolve(),
        delete: () => Promise.resolve()
      },
      JWT_SECRET: 'test-secret-key',
      ENVIRONMENT: 'test'
    };
  },

  request(method = 'GET', url = 'http://localhost/test', body = null) {
    const request = {
      method,
      url,
      headers: new Headers()
    };

    if (body) {
      request.json = () => Promise.resolve(body);
    }

    return request;
  }
};
