/**
 * 说说 (Moments) 公开 API
 */
import { Context } from 'hono';
import { queryAll, queryFirst, execute } from './db.js';
import { getClientIp } from './utils.js';
import { loadSaySettings } from './saySettings.js';

// ==================== 获取说说列表 ====================
export async function getSays(c: Context) {
  const page = parseInt(c.req.query('page') || '1');
  const siteId = c.req.query('site_id') || '';
  const settings = await loadSaySettings();
  const limit = Math.min(parseInt(c.req.query('limit') || String(settings.sayPageSize)), 50);
  const offset = (page - 1) * limit;

  let where = `status = 'published'`;
  const params: unknown[] = [];
  let paramIndex = 1;
  if (siteId) {
    where += ` AND site_id = $${paramIndex++}`;
    params.push(siteId);
  }

  const countRow = await queryFirst<{ count: string }>(
    `SELECT COUNT(*) as count FROM "Say" WHERE ${where}`,
    params
  );
  const totalCount = parseInt(countRow?.count || '0', 10);

  const results = await queryAll<any>(
    `SELECT id, created, content_text as "contentText", content_html as "contentHtml",
       status, likes, tags, site_id as "siteId"
     FROM "Say" WHERE ${where}
     ORDER BY created DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  const data = results.map((row: any) => ({
    ...row,
    id: Number(row.id),
    created: Number(row.created),
    likes: Number(row.likes) || 0,
    tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
  }));

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
}

// ==================== 获取单条说说 ====================
export async function getSayById(c: Context) {
  const id = parseInt(c.req.param('id') || '');
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Invalid id' }, 400);
  }

  const row = await queryFirst<any>(
    `SELECT id, created, content_text as "contentText", content_html as "contentHtml",
       status, likes, tags, site_id as "siteId"
     FROM "Say" WHERE id = $1 AND status = 'published'`,
    [id]
  );

  if (!row) {
    return c.json({ message: 'Say not found' }, 404);
  }

  return c.json({
    ...row,
    id: Number(row.id),
    created: Number(row.created),
    likes: Number(row.likes) || 0,
    tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
  });
}

// ==================== 说说点赞 ====================
export async function likeSay(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const id = typeof body.id === 'number' ? body.id : parseInt(String(body.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Invalid id' }, 400);
  }

  const userId = (c.req.header('X-VWD-Like-User') || c.req.header('x-vwd-like-user') || getClientIp(c)).trim() || 'anonymous';
  const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';
  const pageSlug = `say:${id}`;
  const now = Date.now();

  const existing = await queryFirst<{ id: number }>(
    `SELECT id FROM "Likes" WHERE page_slug = $1 AND user_id = $2 AND site_id = $3`,
    [pageSlug, userId, siteId]
  );

  let alreadyLiked = false;
  if (!existing) {
    await execute(
      `INSERT INTO "Likes" (site_id, page_slug, user_id, created_at) VALUES ($1, $2, $3, $4)`,
      [siteId, pageSlug, userId, now]
    );
  } else {
    alreadyLiked = true;
  }

  const totalRow = await queryFirst<{ count: string }>(
    `SELECT COUNT(*) as count FROM "Likes" WHERE page_slug = $1 AND site_id = $2`,
    [pageSlug, siteId]
  );
  const totalLikes = parseInt(totalRow?.count || '0', 10);

  // Sync the likes count back to the Say table so the admin panel can see it
  if (!alreadyLiked) {
    await execute(
      `UPDATE "Say" SET likes = $1 WHERE id = $2`,
      [totalLikes, id]
    );
  }

  return c.json({ liked: true, alreadyLiked, totalLikes });
}
