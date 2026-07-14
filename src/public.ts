/**
 * 公开 API 路由
 */
import { Context } from 'hono';
import { marked } from 'marked';
import { createRequire } from 'module';
import { queryAll, queryFirst, execute, query } from '../lib/db.js';
import { kvGet, kvSet, kvDelete } from '../lib/kv.js';
import {
  getCravatar, decodePostSlug, getAllSlugFormats, getClientIp,
  checkContent, isValidEmail, replaceEmotionSyntax,
} from '../lib/utils.js';
import { loadCommentSettings, saveCommentSettings, addToBlockedList } from '../lib/commentSettings.js';
import { loadFeatureSettings, saveFeatureSettings } from '../lib/featureSettings.js';
import {
  loadEmailNotificationSettings, saveEmailNotificationSettings,
  sendCommentReplyNotification, sendCommentNotification, getAdminNotifyEmail,
} from '../lib/email.js';

const require = createRequire(import.meta.url);
const xssModule = require('xss') as any;
const xss = xssModule as ((html: string, options?: any) => string);
const xssWhiteList = xssModule.whiteList;
const UAParser = require('ua-parser-js');

// ==================== 获取评论列表 ====================
export async function getComments(c: Context) {
  const rawPostSlug = c.req.query('post_slug') || '';
  const postSlug = decodePostSlug(rawPostSlug);
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const nested = c.req.query('nested') !== 'false';
  const avatarPrefix = c.req.query('avatar_prefix');
  const siteId = c.req.query('site_id');
  const offset = (page - 1) * limit;

  if (!postSlug) return c.json({ message: 'post_slug is required' }, 400);

  let slugList: string[] = [postSlug];
  try {
    const url = new URL(postSlug);
    const origin = url.origin;
    const urlPath = url.pathname || '/';
    if (urlPath === '/') {
      slugList = Array.from(new Set([origin + '/', origin]));
    } else {
      const has = urlPath.endsWith('/');
      slugList = Array.from(new Set([origin + (has ? urlPath : urlPath + '/'), origin + (has ? urlPath.slice(0, -1) : urlPath)]));
    }
  } catch {
    const p = postSlug.split('?')[0].split('#')[0];
    if (p === '/' || p === '') slugList = ['/'];
    else {
      const has = p.endsWith('/');
      slugList = Array.from(new Set([has ? p : p + '/', has ? p.slice(0, -1) : p]));
    }
  }

  const allFormats = new Set<string>();
  for (const s of slugList) for (const f of getAllSlugFormats(s)) allFormats.add(f);
  const equalSlugs = Array.from(allFormats);

  let paramIndex = 1;
  let whereParts: string[] = [];
  if (equalSlugs.length === 1) whereParts.push(`post_slug = $${paramIndex++}`);
  else {
    const ph = equalSlugs.map(() => `$${paramIndex++}`).join(', ');
    whereParts.push(`post_slug IN (${ph})`);
  }
  let finalWhere = `(${whereParts.join(' OR ')})`;
  const bindParams: unknown[] = [...equalSlugs];
  if (siteId) { finalWhere += ` AND site_id = $${paramIndex++}`; bindParams.push(siteId); }
  finalWhere = `status = 'approved' AND ${finalWhere}`;

  const results = await queryAll<any>(
    `SELECT id, name, email, url, content_text as "contentText", content_html as "contentHtml",
       created, parent_id as "parentId", post_slug as "postSlug", post_url as "postUrl",
       priority, COALESCE(likes, 0) as likes
     FROM "Comment" WHERE ${finalWhere} ORDER BY priority DESC, created DESC`,
    bindParams
  );

  const adminEmailRow = await queryFirst<{ value: string }>(`SELECT value FROM "Settings" WHERE key = $1`, ['comment_admin_email']);
  const adminEmail = adminEmailRow?.value || null;

  const allComments = await Promise.all(results.map(async (row: any) => ({
    ...row,
    id: Number(row.id),
    parentId: row.parentId ? Number(row.parentId) : null,
    created: Number(row.created),
    likes: Number(row.likes) || 0,
    avatar: await getCravatar(row.email, row.name, avatarPrefix || undefined),
    isAdmin: adminEmail && row.email === adminEmail,
    replies: [],
  })));

  if (nested) {
    const map = new Map();
    const roots: any[] = [];
    allComments.forEach(c2 => map.set(c2.id, c2));
    allComments.forEach(c2 => { if (!c2.parentId) roots.push(c2); });
    allComments.forEach(c2 => {
      if (c2.parentId) {
        const parent = map.get(c2.parentId);
        if (parent) c2.replyToAuthor = parent.name;
        let rootId = c2.parentId, cur = map.get(rootId);
        while (cur && cur.parentId) { rootId = cur.parentId; cur = map.get(rootId); }
        const root = map.get(rootId);
        if (root && !root.parentId) root.replies.push(c2);
      }
    });
    roots.forEach(r => r.replies.sort((a: any, b: any) => a.created - b.created));
    const data = roots.slice(offset, offset + limit);
    return c.json({ data, pagination: { page, limit, total: Math.ceil(roots.length / limit), totalCount: allComments.length } });
  } else {
    const data = allComments.slice(offset, offset + limit);
    return c.json({ data, pagination: { page, limit, total: Math.ceil(allComments.length / limit), totalCount: allComments.length } });
  }
}

// ==================== 发布评论 ====================
export async function postComment(c: Context) {
  const data = await c.req.json().catch(() => ({}));
  const { post_slug, post_title, post_url, name: rawName, email: rawEmail, url: rawUrl, content: rawContent, parent_id: parentId, site_id, adminToken } = data;

  if (!post_slug || !rawName || !rawEmail || !rawContent) {
    return c.json({ message: 'Missing required fields' }, 400);
  }

  if (!isValidEmail(rawEmail.trim())) {
    return c.json({ message: '邮箱格式不正确' }, 400);
  }

  const settings = await loadCommentSettings();
  const ip = getClientIp(c);
  const email = rawEmail.trim();

  // Check blocked IPs/emails
  if (settings.blockedIps.includes(ip)) return c.json({ message: 'IP 已被封禁' }, 403);
  if (settings.blockedEmails.includes(email)) return c.json({ message: '邮箱已被封禁' }, 403);

  // Admin token verification: when commenter email matches admin email
  let isAdminComment = false;
  if (settings.adminEmail && email === settings.adminEmail && settings.adminKey) {
    const lockKey = `admin_lock:${ip}`;
    const isLocked = await kvGet(lockKey);
    if (isLocked) {
      return c.json({ message: '验证失败次数过多，请30分钟后再试' }, 403);
    }

    if (!adminToken) {
      return c.json({ message: '请输入管理员密钥', requireAuth: true }, 401);
    }

    if (adminToken !== settings.adminKey) {
      const failKey = `admin_fail:${ip}`;
      const failsStr = await kvGet(failKey) || '0';
      let fails = parseInt(failsStr) + 1;
      if (fails >= 3) {
        await kvSet(lockKey, '1', 1800);
        await kvDelete(failKey);
        return c.json({ message: '验证失败次数过多，请30分钟后再试' }, 403);
      } else {
        await kvSet(failKey, fails.toString(), 3600);
        return c.json({ message: '密钥错误' }, 401);
      }
    }

    await kvDelete(`admin_fail:${ip}`);
    isAdminComment = true;
  }

  // Rate limit: check last comment from this IP
  const lastComment = await queryFirst<{ created: number }>(
    `SELECT created FROM "Comment" WHERE ip_address = $1 ORDER BY created DESC LIMIT 1`, [ip]
  );
  if (lastComment && Date.now() - lastComment.created < 10000) {
    return c.json({ message: '评论频繁，等10s后再试' }, 429);
  }

  const cleanedContent = checkContent(rawContent);
  if (!cleanedContent) {
    return c.json({ message: '评论内容不能为空' }, 400);
  }
  const contentText = cleanedContent;
  const name = checkContent(rawName) || 'Anonymous';
  const url = rawUrl?.trim() || null;

  // Load emotion URL
  const featureSettings = await loadFeatureSettings();
  let emotionUrl = featureSettings.emotionUrl || '';
  if (!emotionUrl) {
    const reqUrl = new URL(c.req.url);
    emotionUrl = `${reqUrl.origin}/emotion`;
  }

  const contentWithEmotion = replaceEmotionSyntax(cleanedContent, emotionUrl);
  const html = await marked.parse(contentWithEmotion, { async: true });
  const contentHtml = xss(html, {
    whiteList: {
      ...xssWhiteList,
      code: ['class'], span: ['class', 'style'], pre: ['class'],
      div: ['class', 'style'],
      img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class', 'referrerpolicy', 'loading'],
    },
  });

  const ua = c.req.header('user-agent') || '';
  const uaResult = new UAParser(ua).getResult();
  const defaultStatus = settings.requireReview && !isAdminComment ? 'pending' : 'approved';

  const result = await query<{ id: number }>(
    `INSERT INTO "Comment" (created, post_slug, post_url, name, email, url, ip_address, os, browser, device, ua, content_text, content_html, parent_id, status, site_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
    [Date.now(), post_slug, post_url || null, name, email, url, ip,
     `${uaResult.os.name || ''} ${uaResult.os.version || ''}`.trim(),
     `${uaResult.browser.name || ''} ${uaResult.browser.version || ''}`.trim(),
     uaResult.device.model || uaResult.device.type || 'Desktop', ua,
     contentText, contentHtml, parentId || null, defaultStatus, site_id || '']
  );

  const commentId = result.rows[0]?.id;

  // Send email notifications
  try {
    const emailSettings = await loadEmailNotificationSettings();
    if (emailSettings.globalEnabled) {
      if (parentId) {
        const parent = await queryFirst<{ email: string; name: string; content_html: string }>(
          `SELECT email, name, content_html FROM "Comment" WHERE id = $1`, [parentId]
        );
        if (parent && parent.email !== email) {
          await sendCommentReplyNotification({
            toEmail: parent.email, toName: parent.name, postTitle: post_title || post_slug,
            parentComment: parent.content_html, replyAuthor: name, replyContent: contentHtml, postUrl: post_url || '',
          }, emailSettings.smtp, emailSettings.templates?.reply);
        }
      } else {
        await sendCommentNotification({
          postTitle: post_title || post_slug, postUrl: post_url || '',
          commentAuthor: name, commentContent: contentHtml,
        }, emailSettings.smtp, emailSettings.templates?.admin);
      }
    }
  } catch (e: any) {
    console.error('Email notification failed:', e?.message);
  }

  return c.json({ message: '评论成功', data: { id: commentId, status: defaultStatus } });
}

// ==================== 验证管理员密钥 ====================
export async function verifyAdminKey(c: Context) {
  const { adminToken } = await c.req.json();
  const ip = getClientIp(c);

  if (!adminToken) return c.json({ message: '请输入管理员密钥' }, 401);

  const lockKey = `admin_lock:${ip}`;
  const isLocked = await kvGet(lockKey);
  if (isLocked) return c.json({ message: '验证失败次数过多，请30分钟后再试' }, 403);

  const adminKey = await queryFirst<{ value: string }>(`SELECT value FROM "Settings" WHERE key = $1`, ['comment_admin_key_hash']);
  if (!adminKey) return c.json({ message: '未设置管理员密钥' }, 200);

  if (adminToken !== adminKey.value) {
    const failKey = `admin_fail:${ip}`;
    const failsStr = await kvGet(failKey) || '0';
    let fails = parseInt(failsStr) + 1;
    if (fails >= 3) {
      await kvSet(lockKey, '1', 1800);
      await kvDelete(failKey);
      return c.json({ message: '验证失败次数过多，请30分钟后再试' }, 403);
    } else {
      await kvSet(failKey, fails.toString(), 3600);
      return c.json({ message: '密钥错误' }, 401);
    }
  }

  await kvDelete(`admin_fail:${ip}`);
  return c.json({ message: '验证通过' });
}

// ==================== 公开配置接口 ====================
export async function getPublicConfig(c: Context) {
  try {
    const settings = await loadCommentSettings();
    const featureSettings = await loadFeatureSettings();

    // Strip sensitive fields
    const { adminKey, adminKeySet, blockedIps, blockedEmails, ...publicSettings } = settings as any;

    // Auto-detect emotion URL from request origin, fallback to manual override
    const url = new URL(c.req.url);
    const autoEmotionUrl = `${url.origin}/emotion`;
    const emotionUrl = featureSettings.emotionUrl || autoEmotionUrl;

    return c.json({ ...publicSettings, ...featureSettings, emotionUrl });
  } catch (e: any) {
    return c.json({ message: e.message || '加载评论配置失败' }, 500);
  }
}

// ==================== 表情数据接口 ====================
export async function getEmotions(c: Context) {
  try {
    const url = new URL(c.req.url);
    const baseUrl = `${url.origin}/emotion`;

    // Try to read OwO.json from public/emotion directory
    // On Vercel, static files in /public are served at root, so /emotion/OwO.json should be accessible
    // We'll try to fetch it, or return a minimal response
    try {
      const response = await fetch(`${url.origin}/emotion/OwO.json`);
      if (response.ok) {
        const data = await response.json();
        return c.json({ data, baseUrl });
      }
    } catch {
      // Fallback if fetch fails
    }

    return c.json({ data: {}, baseUrl });
  } catch (e: any) {
    return c.json({ message: e.message || '获取表情数据失败' }, 500);
  }
}

// ==================== 访问统计 ====================
export async function trackVisit(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const rawPostSlug = typeof body.postSlug === 'string' ? body.postSlug.trim() : '';
  const postSlug = decodePostSlug(rawPostSlug);
  const rawPostTitle = typeof body.postTitle === 'string' ? body.postTitle.trim() : '';
  const rawPostUrl = typeof body.postUrl === 'string' ? body.postUrl.trim() : '';
  const rawSiteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';

  if (!postSlug) return c.json({ message: 'postSlug is required' }, 400);

  const nowTs = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  let domain: string | null = null;
  try { if (rawPostUrl) domain = new URL(rawPostUrl).hostname.toLowerCase(); } catch {}

  await execute(
    `INSERT INTO page_stats (site_id, post_slug, post_title, post_url, pv, last_visit_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 1, $5, $5, $5)
     ON CONFLICT (site_id, post_slug) DO UPDATE SET
       pv = page_stats.pv + 1, last_visit_at = $5, updated_at = $5,
       post_title = EXCLUDED.post_title, post_url = EXCLUDED.post_url`,
    [rawSiteId, postSlug, rawPostTitle || null, rawPostUrl || null, nowTs]
  );

  // Update daily
  let dailyQuery = `SELECT id, count FROM page_visit_daily WHERE date = $1 AND site_id = $2`;
  const params: unknown[] = [today, rawSiteId];
  if (domain) { dailyQuery += ` AND domain = $3`; params.push(domain); }
  else { dailyQuery += ` AND domain IS NULL`; }

  const daily = await queryFirst<{ id: number; count: number }>(dailyQuery, params);
  if (!daily) {
    await execute(
      `INSERT INTO page_visit_daily (date, site_id, domain, count, created_at, updated_at) VALUES ($1, $2, $3, 1, $4, $4)`,
      [today, rawSiteId, domain, nowTs]
    );
  } else {
    await execute(`UPDATE page_visit_daily SET count = $1, updated_at = $2 WHERE id = $3`, [daily.count + 1, nowTs, daily.id]);
  }

  return c.json({ success: true });
}

export async function getPagePv(c: Context) {
  const rawPostSlug = c.req.query('post_slug') || '';
  const postSlug = decodePostSlug(rawPostSlug);
  const rawSiteId = c.req.query('siteId') || '';
  const siteId = rawSiteId && rawSiteId !== 'default' ? rawSiteId : '';

  if (!postSlug) return c.json({ message: 'post_slug is required' }, 400);

  let row: { pv: number } | null = null;
  if (siteId) {
    row = await queryFirst<{ pv: number }>(`SELECT pv FROM page_stats WHERE post_slug = $1 AND site_id = $2`, [postSlug, siteId]);
  } else {
    row = await queryFirst<{ pv: number }>(`SELECT pv FROM page_stats WHERE post_slug = $1 AND (site_id = $2 OR site_id IS NULL)`, [postSlug, '']);
  }

  return c.json({ pv: row?.pv || 0, postSlug });
}

// ==================== 文章点赞 ====================
export async function getLikeStatus(c: Context) {
  const rawPostSlug = c.req.query('post_slug') || '';
  const postSlug = decodePostSlug(rawPostSlug);
  const siteId = c.req.query('siteId') || '';
  if (!postSlug) return c.json({ message: 'post_slug is required' }, 400);

  const userId = (c.req.header('X-VWD-Like-User') || c.req.header('x-vwd-like-user') || c.req.header('X-CWD-Like-User') || c.req.header('x-cwd-like-user') || '').trim();
  const totalRow = await queryFirst<{ count: string }>(`SELECT COUNT(*) as count FROM "Likes" WHERE page_slug = $1 AND site_id = $2`, [postSlug, siteId]);
  let liked = false;
  if (userId) {
    const row = await queryFirst<{ id: number }>(`SELECT id FROM "Likes" WHERE page_slug = $1 AND user_id = $2 AND site_id = $3`, [postSlug, userId, siteId]);
    liked = !!row;
  }
  const totalLikes = parseInt(totalRow?.count || '0', 10);
  return c.json({ liked, alreadyLiked: false, totalLikes });
}

export async function likePage(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const rawPostSlug = typeof body.postSlug === 'string' ? body.postSlug.trim() : '';
  const postSlug = decodePostSlug(rawPostSlug);
  const rawPostTitle = typeof body.postTitle === 'string' ? body.postTitle.trim() : '';
  const rawPostUrl = typeof body.postUrl === 'string' ? body.postUrl.trim() : '';
  const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';

  if (!postSlug) return c.json({ message: 'postSlug is required' }, 400);

  const userId = (c.req.header('X-VWD-Like-User') || c.req.header('x-vwd-like-user') || c.req.header('X-CWD-Like-User') || c.req.header('x-cwd-like-user') || getClientIp(c)).trim() || 'anonymous';
  const now = Date.now();

  const existing = await queryFirst<{ id: number }>(`SELECT id FROM "Likes" WHERE page_slug = $1 AND user_id = $2 AND site_id = $3`, [postSlug, userId, siteId]);
  let alreadyLiked = false;
  if (!existing) {
    await execute(`INSERT INTO "Likes" (page_slug, user_id, created_at, site_id) VALUES ($1, $2, $3, $4)`, [postSlug, userId, now, siteId]);
  } else {
    alreadyLiked = true;
  }

  // Ensure page_stats exists
  const statsRow = await queryFirst<{ id: number }>(`SELECT id FROM page_stats WHERE post_slug = $1 AND site_id = $2`, [postSlug, siteId]);
  if (!statsRow) {
    await execute(`INSERT INTO page_stats (post_slug, post_title, post_url, pv, last_visit_at, created_at, updated_at, site_id) VALUES ($1, $2, $3, 0, $4, $4, $4, $5)`, [postSlug, rawPostTitle || null, rawPostUrl || null, now, siteId]);
  } else if (rawPostTitle || rawPostUrl) {
    await execute(`UPDATE page_stats SET post_title = COALESCE($1, post_title), post_url = COALESCE($2, post_url), updated_at = $3 WHERE id = $4`, [rawPostTitle || null, rawPostUrl || null, now, statsRow.id]);
  }

  const totalRow = await queryFirst<{ count: string }>(`SELECT COUNT(*) as count FROM "Likes" WHERE page_slug = $1 AND site_id = $2`, [postSlug, siteId]);
  const totalLikes = parseInt(totalRow?.count || '0', 10);
  return c.json({ liked: true, alreadyLiked, totalLikes });
}

// ==================== 评论点赞 ====================
export async function likeComment(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const rawId = body?.id ?? body?.commentId ?? c.req.query('id') ?? c.req.query('commentId') ?? null;
  const parsed = typeof rawId === 'number' ? rawId : rawId ? parseInt(String(rawId).trim(), 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return c.json({ message: 'Missing or invalid id' }, 400);

  const id = parsed;
  const method = c.req.method;

  const existing = await queryFirst<{ id: number; likes: number }>(`SELECT id, likes FROM "Comment" WHERE id = $1`, [id]);
  if (!existing) return c.json({ message: 'Comment not found' }, 404);

  const delta = method === 'DELETE' ? -1 : 1;
  const currentLikes = typeof existing.likes === 'number' ? existing.likes : 0;
  const newLikes = Math.max(0, currentLikes + delta);

  await execute(`UPDATE "Comment" SET likes = $1 WHERE id = $2`, [newLikes, id]);
  return c.json({ id, likes: newLikes });
}
