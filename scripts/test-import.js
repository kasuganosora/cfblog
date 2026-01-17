const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeSQL(sql) {
  const tempFile = path.join(__dirname, '.temp-sql.sql');
  fs.writeFileSync(tempFile, sql);

  try {
    const result = execSync(
      `npx wrangler d1 execute cfblog-database --local --file="${tempFile}" --json`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    console.log('Success:', result);
    return { success: true };
  } catch (error) {
    console.log('Error:', error.stdout);
    return { success: false, error: error.stdout };
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// Test simple insert
const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('Test Category', 'test-category', 'Test description', NULL, 1, '2025-01-01 00:00:00', '2025-01-01 00:00:00');`;

console.log('Testing SQL insert...');
executeSQL(sql);
