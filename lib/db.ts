/**
 * PostgreSQL 数据库访问层
 * 基于 @vercel/postgres，提供 D1 风格的简洁 API
 */
import { sql, db } from '@vercel/postgres';

export type QueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount: number;
};

/**
 * 执行参数化查询（使用 $1, $2... 占位符）
 * @param query SQL 语句，使用 $1, $2... 作为参数占位符
 * @param params 参数数组
 * @returns 查询结果
 */
export async function query<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const result = await db.query(queryText, params as any[]);
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount || 0,
  };
}

/**
 * 查询并返回第一行
 */
export async function queryFirst<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await query<T>(queryText, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * 查询并返回所有行
 */
export async function queryAll<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await query<T>(queryText, params);
  return result.rows;
}

/**
 * 执行 INSERT/UPDATE/DELETE，返回是否成功
 */
export async function execute(
  queryText: string,
  params: unknown[] = []
): Promise<boolean> {
  const result = await db.query(queryText, params as any[]);
  return (result.rowCount || 0) > 0;
}

/**
 * 获取 Settings 表中的值
 */
export async function getSetting(key: string): Promise<string | null> {
  const row = await queryFirst<{ value: string }>(
    'SELECT value FROM "Settings" WHERE key = $1',
    [key]
  );
  return row?.value || null;
}

/**
 * 获取多个 Settings 值
 */
export async function getSettings(keys: string[]): Promise<Map<string, string>> {
  if (keys.length === 0) return new Map();
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const rows = await queryAll<{ key: string; value: string }>(
    `SELECT key, value FROM "Settings" WHERE key IN (${placeholders})`,
    keys
  );
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row && row.key) {
      map.set(row.key, row.value);
    }
  }
  return map;
}

/**
 * 设置 Settings 值（upsert）
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await db.query(
    `INSERT INTO "Settings" (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
}

/**
 * 删除 Settings 值
 */
export async function deleteSetting(key: string): Promise<void> {
  await db.query('DELETE FROM "Settings" WHERE key = $1', [key]);
}

/**
 * 确保 schema 存在（首次部署时自动创建表）
 */
export async function ensureSchema(): Promise<void> {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS "Comment" (
      id SERIAL PRIMARY KEY,
      created BIGINT NOT NULL,
      post_slug TEXT NOT NULL,
      post_url TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      url TEXT,
      ip_address TEXT,
      os TEXT,
      browser TEXT,
      device TEXT,
      ua TEXT,
      content_text TEXT,
      content_html TEXT,
      parent_id BIGINT,
      status TEXT DEFAULT 'approved',
      priority INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      site_id TEXT DEFAULT ''
    )`);

    await db.query('CREATE INDEX IF NOT EXISTS idx_comment_post_slug ON "Comment"(post_slug)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comment_status ON "Comment"(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comment_parent_id ON "Comment"(parent_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comment_site_id ON "Comment"(site_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comment_created ON "Comment"(created DESC)');

    await db.query(`CREATE TABLE IF NOT EXISTS "Settings" (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);

    await db.query(`CREATE TABLE IF NOT EXISTS "Likes" (
      id SERIAL PRIMARY KEY,
      site_id TEXT NOT NULL DEFAULT '',
      page_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      UNIQUE(site_id, page_slug, user_id)
    )`);
    await db.query('CREATE INDEX IF NOT EXISTS idx_likes_site_id ON "Likes"(site_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_likes_page_slug ON "Likes"(page_slug)');

    await db.query(`CREATE TABLE IF NOT EXISTS "Say" (
      id SERIAL PRIMARY KEY,
      created BIGINT NOT NULL,
      content_text TEXT NOT NULL,
      content_html TEXT NOT NULL,
      status TEXT DEFAULT 'published',
      likes INTEGER DEFAULT 0,
      tags TEXT,
      site_id TEXT DEFAULT ''
    )`);
    await db.query('CREATE INDEX IF NOT EXISTS idx_say_created ON "Say"(created DESC)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_say_status ON "Say"(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_say_site_id ON "Say"(site_id)');

    console.log('[DB] Schema ensured');
  } catch (e) {
    console.error('[DB] Schema init failed:', e);
  }
}

export { sql };
