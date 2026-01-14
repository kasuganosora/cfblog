// 检查 admin.js 语法
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/admin.js');
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== 检查括号平衡 ===');

// 检查大括号平衡
let braceCount = 0;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  
  braceCount += openBraces;
  braceCount -= closeBraces;
  
  if (braceCount < 0) {
    console.log(`❌ 第 ${i + 1} 行: 多余的关闭大括号，当前 braceCount = ${braceCount}`);
    console.log(`   内容: ${line}`);
  }
}

console.log(`\n最终大括号计数: ${braceCount}`);
if (braceCount === 0) {
  console.log('✅ 大括号平衡');
} else if (braceCount > 0) {
  console.log(`❌ 缺少 ${braceCount} 个关闭大括号`);
} else {
  console.log(`❌ 多出 ${-braceCount} 个关闭大括号`);
}

// 检查函数定义
console.log('\n=== 检查函数定义 ===');
const functionRegex = /(async\s+)?function\s+\w+|export\s+(async\s+)?function\s+\w+/g;
let match;
while ((match = functionRegex.exec(content)) !== null) {
  console.log(`找到函数: ${match[0]}`);
}

// 清理
fs.unlinkSync(path.join(__dirname, 'check-syntax.js'));