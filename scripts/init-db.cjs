/**
 * 数据库初始化脚本
 * 读取 sql/schema.sql 并执行
 * 
 * 用法: node scripts/init-db.cjs
 * 需要设置 POSTGRES_URL 环境变量
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const schemaPath = path.resolve(__dirname, '..', 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Initializing database...');
  console.log('Make sure POSTGRES_URL is set in your environment.\n');

  // 使用 @vercel/postgres
  const { db } = require('@vercel/postgres');

  try {
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        await db.query(stmt);
        console.log('OK:', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
      } catch (e) {
        // Ignore "already exists" errors
        if (!e.message.includes('already exists')) {
          console.error('ERROR:', e.message);
        }
      }
    }

    console.log('\nDatabase initialized successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Failed to initialize database:', e);
    process.exit(1);
  }
}

main();
