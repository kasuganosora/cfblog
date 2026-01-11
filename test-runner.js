// 测试运行器 - 统一运行所有测试
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function runCommand(command, description) {
  log(`\n${'━'.repeat(50)}`, 'cyan');
  log(`🚀 ${description}`, 'bright');
  log('━'.repeat(50), 'cyan');

  try {
    execSync(command, { stdio: 'inherit', shell: true });
    return true;
  } catch (error) {
    log(`\n❌ ${description} 失败`, 'red');
    return false;
  }
}

async function main() {
  log('\n' + '🧪'.repeat(10), 'bright');
  log('  Cloudflare Blog 测试套件', 'bright');
  log('🧪'.repeat(10) + '\n', 'bright');

  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  let allPassed = true;

  switch (testType) {
    case 'unit':
      log('📚 运行单元测试...', 'blue');
      allPassed = runCommand('node tests/unit/run-tests.js', '单元测试');
      break;

    case 'integration':
      log('🌐 运行集成测试...', 'blue');
      log('⚠️  确保开发服务器正在运行: npm run dev', 'yellow');
      allPassed = runCommand('node tests/integration/run-tests.js', '集成测试');
      break;

    case 'api':
      log('🔌 运行 API 测试...', 'blue');
      allPassed = runCommand('node test-api.js', 'API 测试');
      break;

    case 'simple':
      log('⚡ 运行简单测试...', 'blue');
      allPassed = runCommand('node test-simple.js', '简单测试');
      break;

    case 'all':
    default:
      log('📚 运行单元测试...', 'blue');
      const unitPassed = runCommand('node tests/unit/run-tests.js', '单元测试');

      if (unitPassed) {
        log('\n🌐 运行集成测试...', 'blue');
        log('⚠️  确保开发服务器正在运行: npm run dev', 'yellow');
        const integrationPassed = runCommand('node tests/integration/run-tests.js', '集成测试');

        if (integrationPassed) {
          log('\n🔌 运行 API 测试...', 'blue');
          const apiPassed = runCommand('node test-api.js', 'API 测试');

          allPassed = unitPassed && integrationPassed && apiPassed;
        } else {
          allPassed = false;
        }
      } else {
        allPassed = false;
      }
      break;
  }

  log('\n' + '━'.repeat(50), 'cyan');
  if (allPassed) {
    log('🎉 所有测试通过！', 'green');
    log('   项目可以正常工作了！', 'bright');
  } else {
    log('❌ 部分测试失败', 'red');
    log('   请检查错误信息并修复问题', 'bright');
  }
  log('━'.repeat(50) + '\n', 'cyan');

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ 测试运行器错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
