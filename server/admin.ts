/**
 * 管理 API 路由
 */
import { Context } from 'hono';
import { marked } from 'marked';
import { createRequire } from 'module';
import { queryAll, queryFirst, execute, query, getSetting, getSettings, setSetting, deleteSetting } from './db.js';
import { kvGet, kvSet, kvDelete } from './kv.js';
import { getClientIp, getCravatar, replaceEmotionSyntax, checkContent, isValidEmail } from './utils.js';
import { S3Client } from './s3.js';
import {
  loadCommentSettings, saveCommentSettings as saveCommentSettingsLib,
  loadAdminDisplaySettings, saveAdminDisplaySettings as saveAdminDisplaySettingsLib,
  addToBlockedList,
} from './commentSettings.js';
import { loadFeatureSettings, saveFeatureSettings } from './featureSettings.js';
import {
  loadEmailNotificationSettings, saveEmailNotificationSettings,
  sendTestEmail, getAdminNotifyEmail, sendCommentApprovedNotification,
} from './email.js';

const require = createRequire(import.meta.url);
const xssModule = require('xss') as any;
const xss = xssModule as ((html: string, options?: any) => string);
const xssWhiteList = xssModule.whiteList;

// ==================== 初始化设置 ====================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkSetupStatus(c: Context) {
  try {
    const adminName = await getSetting('admin_name');
    return c.json({ setupCompleted: !!adminName });
  } catch (e: any) {
    // Database not connected yet — treat as not set up
    return c.json({ setupCompleted: false, error: 'database_not_connected' });
  }
}

export async function setupAdmin(c: Context) {
  // 如果已经设置过管理员，拒绝再次设置
  const existing = await getSetting('admin_name');
  if (existing) {
    return c.json({ message: '管理员账户已初始化，如需修改请登录后在设置中操作' }, 400);
  }

  const data = await c.req.json();
  const name = (data.name || '').trim();
  const password = data.password || '';

  if (!name || name.length < 2) {
    return c.json({ message: '用户名至少 2 个字符' }, 400);
  }
  if (!password || password.length < 6) {
    return c.json({ message: '密码至少 6 个字符' }, 400);
  }

  const passwordHash = await hashPassword(password);
  await setSetting('admin_name', name);
  await setSetting('admin_password_hash', passwordHash);

  // 自动登录，颁发 token
  const ip = getClientIp(c);
  const tempKey = crypto.randomUUID();
  await kvSet(`token:${tempKey}`, JSON.stringify({ user: name, ip }), 172800);

  return c.json({ data: { key: tempKey, message: '设置成功' } });
}

// ==================== 登录 ====================
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60;

export async function adminLogin(c: Context) {
  const data = await c.req.json();
  const ip = getClientIp(c);

  const blockKey = `block:${ip}`;
  const attemptKey = `attempts:${ip}`;

  const isBlocked = await kvGet(blockKey);
  if (isBlocked) return c.json({ message: 'IP 已被封禁，30 分钟后重试' }, 403);

  // 从数据库读取管理员凭证
  const adminName = await getSetting('admin_name');
  const adminPasswordHash = await getSetting('admin_password_hash');

  if (!adminName || !adminPasswordHash) {
    return c.json({ message: '管理员账户尚未初始化，请先完成初始设置', needSetup: true }, 400);
  }

  const inputHash = await hashPassword(data.password || '');
  const isValid = data.name === adminName && inputHash === adminPasswordHash;

  if (!isValid) {
    const attempts = parseInt((await kvGet(attemptKey)) || '0') + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await kvSet(blockKey, '1', LOCK_TIME);
      await kvDelete(attemptKey);
      return c.json({ message: 'IP 已被封禁，30 分钟后重试' }, 403);
    } else {
      await kvSet(attemptKey, attempts.toString(), 600);
      return c.json({ message: '用户名或密码无效', failedAttempts: attempts }, 401);
    }
  }

  await kvDelete(attemptKey);
  const tempKey = crypto.randomUUID();
  await kvSet(`token:${tempKey}`, JSON.stringify({ user: data.name, ip }), 172800);

  return c.json({ data: { key: tempKey } });
}

// ==================== 获取评论列表（管理） ====================
export async function getAdminComments(c: Context) {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const status = c.req.query('status');
  const search = c.req.query('search');
  const siteId = c.req.query('site_id') || c.req.query('siteId');
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    where += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (search) {
    where += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR content_text ILIKE $${paramIndex} OR ip_address ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (siteId && siteId !== 'default') {
    where += ` AND site_id = $${paramIndex++}`;
    params.push(siteId);
  }

  const countRow = await queryFirst<{ count: string }>(`SELECT COUNT(*) as count FROM "Comment" WHERE ${where}`, params);
  const totalCount = parseInt(countRow?.count || '0', 10);

  const results = await queryAll<any>(
    `SELECT id, created, post_slug as "postSlug", post_url as "postUrl", name, email, url,
       ip_address as "ipAddress", os, browser, device, ua, content_text as "contentText",
       content_html as "contentHtml", parent_id as "parentId", status, priority,
       COALESCE(likes, 0) as likes, site_id as "siteId"
     FROM "Comment" WHERE ${where}
     ORDER BY created DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  const settings = await loadCommentSettings();
  const data = await Promise.all(results.map(async (row: any) => ({
    ...row,
    created: Number(row.created),
    avatar: await getCravatar(row.email, row.name, settings.avatarPrefix || undefined),
    isAdmin: !!(settings.adminEmail && row.email === settings.adminEmail),
  })));

  return c.json({
    data,
    pagination: { page, limit, total: Math.ceil(totalCount / limit), totalCount },
  });
}

// ==================== 删除评论 ====================
export async function deleteComment(c: Context) {
  const id = c.req.query('id');
  if (!id) return c.json({ message: 'Missing id' }, 400);

  const success = await execute(`DELETE FROM "Comment" WHERE id = $1`, [id]);
  if (!success) return c.json({ message: 'Delete operation failed' }, 500);
  return c.json({ message: `Comment deleted, id: ${id}.` });
}

// ==================== 更新评论状态====================
export async function updateStatus(c: Context) {
  const id = c.req.query('id');
  const status = c.req.query('status');
  if (!id || !status) return c.json({ message: 'Missing id or status' }, 400);

  const success = await execute(`UPDATE "Comment" SET status = $1 WHERE id = $2`, [status, id]);
  if (!success) return c.json({ message: 'Update failed' }, 500);

  // 审核通过时发送邮件通知评论者
  if (status === 'approved') {
    try {
      const comment = await queryFirst<{ email: string; name: string; post_title: string; post_url: string | null; post_slug: string; content_html: string; status: string }>(
        `SELECT email, name, post_url, post_slug, content_html, status FROM "Comment" WHERE id = $1`, [id]
      );
      if (comment && comment.email) {
        const prevStatus = comment.status;
        // Only notify if the comment was previously not approved
        if (prevStatus !== 'approved') {
          const emailSettings = await loadEmailNotificationSettings();
          if (emailSettings.globalEnabled) {
            await sendCommentApprovedNotification({
              toEmail: comment.email,
              commentAuthor: comment.name,
              postTitle: comment.post_slug,
              postUrl: comment.post_url || '',
              commentContent: comment.content_html,
            }, emailSettings.smtp, emailSettings.templates?.approved);
          }
        }
      }
    } catch (e: any) {
      console.error('Approved notification failed:', e?.message);
    }
  }

  return c.json({ message: `Comment status updated, id: ${id}, status: ${status}.` });
}

// ==================== 更新评论内容 ====================
export async function updateComment(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid JSON body' }, 400);
  }

  const rawId = body?.id;
  const id =
    typeof rawId === 'number'
      ? rawId
      : typeof rawId === 'string' && rawId.trim()
      ? Number.parseInt(rawId.trim(), 10)
      : NaN;

  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Missing or invalid id' }, 400);
  }

  const existing = await queryFirst<{ id: number; status: string; post_slug: string; post_url: string | null; priority: number | null }>(
    `SELECT id, status, post_slug, post_url, priority FROM "Comment" WHERE id = $1`, [id]
  );

  if (!existing) {
    return c.json({ message: 'Comment not found' }, 404);
  }

  const rawName = typeof body.name === 'string' ? body.name : '';
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const rawUrl = typeof body.url === 'string' ? body.url : '';
  const rawStatus = typeof body.status === 'string' ? body.status : existing.status;
  const rawPriority = body.priority;
  const hasPostSlugField =
    Object.prototype.hasOwnProperty.call(body, 'postSlug') ||
    Object.prototype.hasOwnProperty.call(body, 'post_slug');
  const rawPostSlug =
    typeof body.postSlug === 'string'
      ? body.postSlug
      : typeof body.post_slug === 'string'
      ? body.post_slug
      : '';
  const hasPostUrlField =
    Object.prototype.hasOwnProperty.call(body, 'postUrl') ||
    Object.prototype.hasOwnProperty.call(body, 'post_url');
  const rawPostUrl =
    typeof body.postUrl === 'string'
      ? body.postUrl
      : typeof body.post_url === 'string'
      ? body.post_url
      : '';

  const contentSource =
    typeof body.content === 'string'
      ? body.content
      : typeof body.contentText === 'string'
      ? body.contentText
      : '';

  const name = rawName.trim();
  const email = rawEmail.trim();
  const url = rawUrl.trim() || null;
  const status = rawStatus.trim();
  const postSlug = hasPostSlugField
    ? (rawPostSlug.trim() || existing.post_slug)
    : existing.post_slug;
  const postUrl = hasPostUrlField
    ? (rawPostUrl.trim() || null)
    : existing.post_url;

  let priority: number = typeof existing.priority === 'number' && Number.isFinite(existing.priority)
    ? existing.priority
    : 1;

  if (rawPriority !== undefined && rawPriority !== null) {
    const parsed =
      typeof rawPriority === 'number'
        ? rawPriority
        : typeof rawPriority === 'string' && rawPriority.trim()
        ? Number.parseInt(rawPriority.trim(), 10)
        : NaN;
    if (Number.isFinite(parsed) && parsed >= 1) {
      priority = parsed;
    }
  }

  if (!name) {
    return c.json({ message: '昵称不能为空' }, 400);
  }
  if (!email) {
    return c.json({ message: '邮箱不能为空' }, 400);
  }

  const cleanedContent = checkContent(contentSource);
  if (!cleanedContent) {
    return c.json({ message: '评论内容不能为空' }, 400);
  }
  const contentText = cleanedContent;

  // 将旧版表情语法转为短代码，前端渲染
  const contentWithEmoji = replaceEmotionSyntax(cleanedContent);
  const html = await marked.parse(contentWithEmoji, { async: true });
  const contentHtml = xss(html, {
    whiteList: {
      ...xssWhiteList,
      code: ['class'], span: ['class', 'style'], pre: ['class'],
      div: ['class', 'style'],
      img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class', 'referrerpolicy', 'loading'],
    },
  });

  const success = await execute(
    `UPDATE "Comment" SET name = $1, email = $2, url = $3, content_text = $4, content_html = $5, status = $6, post_slug = $7, post_url = $8, priority = $9 WHERE id = $10`,
    [name, email, url, contentText, contentHtml, status, postSlug, postUrl, priority, id]
  );

  if (!success) return c.json({ message: 'Update failed' }, 500);
  return c.json({ message: `Comment updated, id: ${id}.` });
}

// ==================== 获取评论统计 ====================
export async function getStats(c: Context) {
  const rawSiteId = c.req.query('siteId');
  const siteId = rawSiteId && rawSiteId !== 'default' ? rawSiteId : null;

  const results = await queryAll<{ created: number; status: string; site_id: string | null; likes: number }>(
    `SELECT created, status, site_id, likes FROM "Comment"`
  );

  const summary = { total: 0, approved: 0, pending: 0, rejected: 0, totalLikes: 0 };
  type DomainCounts = { total: number; approved: number; pending: number; rejected: number };
  const domainMap = new Map<string, DomainCounts>();
  const dailyMap = new Map<string, number>();

  const now = Date.now();
  const thirtyDaysAgo = now - 29 * 24 * 60 * 60 * 1000;

  for (const row of results) {
    const domainKey = row.site_id?.trim() || 'default';
    let counts = domainMap.get(domainKey);
    if (!counts) { counts = { total: 0, approved: 0, pending: 0, rejected: 0 }; domainMap.set(domainKey, counts); }
    counts.total++;
    if (row.status === 'approved') counts.approved++;
    else if (row.status === 'pending') counts.pending++;
    else if (row.status === 'rejected') counts.rejected++;
  }

  const rowsForSummary = siteId
    ? results.filter(r => (r.site_id?.trim() || 'default') === siteId)
    : results;

  for (const row of rowsForSummary) {
    summary.total++;
    summary.totalLikes += Number(row.likes) || 0;
    if (row.status === 'approved') summary.approved++;
    else if (row.status === 'pending') summary.pending++;
    else if (row.status === 'rejected') summary.rejected++;
    if (row.created >= thirtyDaysAgo) {
      const d = new Date(row.created);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }
  }

  const domains = Array.from(domainMap.entries())
    .map(([domain, counts]) => ({ domain, ...counts }))
    .sort((a, b) => b.total - a.total);

  const last7Days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    last7Days.push({ date: key, total: dailyMap.get(key) || 0 });
  }

  // ==================== 说说统计 ====================
  let sayWhere = `1=1`;
  const sayParams: unknown[] = [];
  let sayParamIndex = 1;
  if (siteId) {
    sayWhere = `site_id = $${sayParamIndex++}`;
    sayParams.push(siteId);
  }

  const sayResults = await queryAll<{ created: number; status: string; likes: number }>(
    `SELECT created, status, likes FROM "Say" WHERE ${sayWhere}`,
    sayParams
  );

  const saySummary = { total: 0, published: 0, draft: 0, hidden: 0, totalLikes: 0 };
  const sayDailyMap = new Map<string, number>();

  for (const row of sayResults) {
    saySummary.total++;
    saySummary.totalLikes += Number(row.likes) || 0;
    if (row.status === 'published') saySummary.published++;
    else if (row.status === 'draft') saySummary.draft++;
    else if (row.status === 'hidden') saySummary.hidden++;
    if (row.created >= thirtyDaysAgo) {
      const d = new Date(row.created);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      sayDailyMap.set(key, (sayDailyMap.get(key) || 0) + 1);
    }
  }

  const sayLast7Days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    sayLast7Days.push({ date: key, total: sayDailyMap.get(key) || 0 });
  }

  return c.json({ summary, domains, last7Days, saySummary, sayLast7Days });
}

// ==================== 获取站点列表 ====================
export async function getSiteList(c: Context) {
  try {
    const sites = new Set<string>();

    const commentRows = await queryAll<{ site_id: string }>(`SELECT DISTINCT site_id FROM "Comment"`);
    for (const row of commentRows) {
      if (row.site_id !== undefined && row.site_id !== null) {
        sites.add(row.site_id);
      }
    }

    const list = Array.from(sites);
    list.sort();

    return c.json({ sites: list });
  } catch (e: any) {
    return c.json({ message: e.message || '获取站点列表失败' }, 500);
  }
}

// ==================== 点赞统计 ====================
export async function getLikeStats(c: Context) {
  try {
    const siteId = c.req.query('siteId');

    let sql = `
      SELECT page_slug, COUNT(*) AS likes
      FROM "Likes" l
    `;
    const params: unknown[] = [];

    if (siteId) {
      sql += ' WHERE l.site_id = $1';
      params.push(siteId);
    }

    sql += ' GROUP BY l.page_slug, l.site_id ORDER BY likes DESC LIMIT 50';

    const results = await queryAll<{ page_slug: string; likes: number }>(sql, params);

    const items = results.map(row => ({
      pageSlug: row.page_slug,
      pageTitle: null as string | null,
      pageUrl: null as string | null,
      likes: row.likes,
    }));

    return c.json({ items });
  } catch (e: any) {
    return c.json({ message: e.message || '获取点赞统计失败' }, 500);
  }
}

// ==================== 点赞记录列表 ====================
export async function listLikes(c: Context) {
  try {
    const page = parseInt(c.req.query('page') || '1', 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const rawPageSlug = c.req.query('page_slug') || c.req.query('pageSlug') || '';
    const pageSlug = rawPageSlug.trim();

    const rawUserId = c.req.query('user_id') || c.req.query('userId') || '';
    const userId = rawUserId.trim();

    const rawStart = c.req.query('start') || '';
    const rawEnd = c.req.query('end') || '';

    const whereSql: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (pageSlug) {
      whereSql.push(`page_slug = $${paramIndex++}`);
      params.push(pageSlug);
    }
    if (userId) {
      whereSql.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }
    if (rawStart) {
      const startTs = Number(rawStart);
      if (Number.isFinite(startTs)) {
        whereSql.push(`created_at >= $${paramIndex++}`);
        params.push(startTs);
      }
    }
    if (rawEnd) {
      const endTs = Number(rawEnd);
      if (Number.isFinite(endTs)) {
        whereSql.push(`created_at <= $${paramIndex++}`);
        params.push(endTs);
      }
    }

    const whereClause = whereSql.length ? `WHERE ${whereSql.join(' AND ')}` : '';

    const totalRow = await queryFirst<{ count: string }>(`SELECT COUNT(*) as count FROM "Likes" ${whereClause}`, params);
    const totalCount = parseInt(totalRow?.count || '0', 10);

    const results = await queryAll<{ id: number; page_slug: string; user_id: string; created_at: number }>(
      `SELECT id, page_slug, user_id, created_at FROM "Likes" ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const data = results.map(row => ({
      id: row.id,
      pageSlug: row.page_slug,
      userId: row.user_id,
      createdAt: row.created_at,
    }));

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return c.json({
      data,
      pagination: { page, limit, total: totalPages },
    });
  } catch (e: any) {
    return c.json({ message: e.message || '获取点赞记录失败' }, 500);
  }
}

// ==================== 评论设置 ====================
export async function getCommentSettings(c: Context) {
  try {
    const settings = await loadCommentSettings();
    return c.json(settings);
  } catch (e: any) {
    return c.json({ message: e.message || '加载评论配置失败' }, 500);
  }
}

export async function saveCommentSettings(c: Context) {
  try {
    const body = await c.req.json();
    const rawAdminEmail = typeof body.adminEmail === 'string' ? body.adminEmail : '';
    const rawAdminBadge = typeof body.adminBadge === 'string' ? body.adminBadge : '';
    const rawAvatarPrefix = typeof body.avatarPrefix === 'string' ? body.avatarPrefix : '';
    const rawAdminEnabled = body.adminEnabled;
    const rawAllowedDomains = Array.isArray(body.allowedDomains) ? body.allowedDomains : [];
    const rawAdminKey = typeof body.adminKey === 'string' ? body.adminKey : undefined;
    const rawRequireReview = body.requireReview;
    const rawBlockedIps = Array.isArray(body.blockedIps) ? body.blockedIps : [];
    const rawBlockedEmails = Array.isArray(body.blockedEmails) ? body.blockedEmails : [];

    const adminEmail = rawAdminEmail.trim();
    if (adminEmail && !isValidEmail(adminEmail)) {
      return c.json({ message: '邮箱格式不正确' }, 400);
    }

    await saveCommentSettingsLib({
      adminEmail,
      adminBadge: rawAdminBadge.trim(),
      avatarPrefix: rawAvatarPrefix.trim(),
      adminEnabled: typeof rawAdminEnabled === 'boolean' ? rawAdminEnabled : rawAdminEnabled === '1' || rawAdminEnabled === 1,
      allowedDomains: rawAllowedDomains.map((d: any) => (typeof d === 'string' ? d.trim() : '')).filter(Boolean),
      adminKey: rawAdminKey,
      requireReview: typeof rawRequireReview === 'boolean' ? rawRequireReview : rawRequireReview === '1' || rawRequireReview === 1,
      blockedIps: rawBlockedIps.map((d: any) => (typeof d === 'string' ? d.trim() : '')).filter(Boolean),
      blockedEmails: rawBlockedEmails.map((d: any) => (typeof d === 'string' ? d.trim() : '')).filter(Boolean),
    });

    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '保存失败' }, 500);
  }
}

// ==================== 管理员通知邮箱 ====================
export async function getAdminEmail(c: Context) {
  try {
    const email = await getSetting('admin_notify_email');
    return c.json({ email: email || null });
  } catch (e: any) {
    return c.json({ message: e.message }, 500);
  }
}

export async function setAdminEmail(c: Context) {
  try {
    const { email } = await c.req.json();
    if (!email || !isValidEmail(email)) {
      return c.json({ message: '邮箱格式不正确' }, 400);
    }
    await setSetting('admin_notify_email', email.trim());
    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message }, 500);
  }
}

// ==================== 邮件通知配置 ====================
export async function getEmailNotifySettings(c: Context) {
  try {
    const settings = await loadEmailNotificationSettings();
    return c.json(settings);
  } catch (e: any) {
    return c.json({ message: e.message || '加载邮件通知配置失败' }, 500);
  }
}

export async function saveEmailNotifySettings(c: Context) {
  try {
    const body = await c.req.json();
    await saveEmailNotificationSettings({
      globalEnabled: typeof body.globalEnabled === 'boolean' ? body.globalEnabled : undefined,
      smtp: body.smtp && typeof body.smtp === 'object' ? body.smtp : undefined,
      templates: body.templates && typeof body.templates === 'object' ? body.templates : undefined,
    });
    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '保存失败' }, 500);
  }
}

// ==================== 测试邮件 ====================
export async function sendTestEmailHandler(c: Context) {
  const data = await c.req.json();
  const toEmail = data.toEmail || data.to;

  if (!toEmail || !isValidEmail(toEmail)) {
    return c.json({ message: '请输入有效的接收邮箱' }, 400);
  }

  const smtp = data.smtp;
  if (!smtp || !smtp.user || !smtp.pass) {
    // Fall back to saved settings
    const emailSettings = await loadEmailNotificationSettings();
    if (!emailSettings.smtp || !emailSettings.smtp.user || !emailSettings.smtp.pass) {
      return c.json({ message: 'SMTP 配置不完整' }, 400);
    }
    const result = await sendTestEmail(toEmail, emailSettings.smtp);
    return c.json(
      result.success ? { message: '邮件发送成功' } : { message: '邮件发送失败： ' + result.message },
      result.success ? 200 : 500
    );
  }

  const result = await sendTestEmail(toEmail, smtp);
  return c.json(
    result.success ? { message: '邮件发送成功' } : { message: '邮件发送失败： ' + result.message },
    result.success ? 200 : 500
  );
}

// ==================== 功能开关设置====================
export async function getFeatureSettings(c: Context) {
  try {
    const settings = await loadFeatureSettings();
    return c.json(settings);
  } catch (e: any) {
    return c.json({ message: e.message || 'Failed to load feature settings' }, 500);
  }
}

export async function updateFeatureSettings(c: Context) {
  try {
    const body = await c.req.json();
    await saveFeatureSettings({
      enableCommentLike: typeof body.enableCommentLike === 'boolean' ? body.enableCommentLike : undefined,
      enableArticleLike: typeof body.enableArticleLike === 'boolean' ? body.enableArticleLike : undefined,
      enableImageLightbox: typeof body.enableImageLightbox === 'boolean' ? body.enableImageLightbox : undefined,
      enableEmoji: typeof body.enableEmoji === 'boolean' ? body.enableEmoji : undefined,
      commentPlaceholder: typeof body.commentPlaceholder === 'string' ? body.commentPlaceholder.trim() : undefined,
      emojiPaths: Array.isArray(body.emojiPaths) ? body.emojiPaths : undefined,
      visibleDomains: Array.isArray(body.visibleDomains) ? body.visibleDomains : undefined,
    });
    return c.json({ message: '保存成功！' });
  } catch (e: any) {
    return c.json({ message: e.message || 'Failed to save feature settings' }, 500);
  }
}

// ==================== 管理后台显示设置 ====================
export async function getAdminDisplaySettings(c: Context) {
  try {
    const settings = await loadAdminDisplaySettings();
    return c.json(settings);
  } catch (e: any) {
    return c.json({ message: e.message || '加载显示配置失败' }, 500);
  }
}

export async function saveAdminDisplaySettings(c: Context) {
  try {
    const body = await c.req.json();
    const layoutTitle = typeof body.layoutTitle === 'string' ? body.layoutTitle : undefined;
    await saveAdminDisplaySettingsLib({ layoutTitle });
    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '保存失败' }, 500);
  }
}

// ==================== 封禁管理 ====================
export async function blockIp(c: Context) {
  try {
    const { ip } = await c.req.json();
    if (!ip || typeof ip !== 'string' || !ip.trim()) {
      return c.json({ message: 'IP 地址不能为空' }, 400);
    }
    await addToBlockedList('ip', ip.trim());
    return c.json({ message: '已加入 IP 黑名单' });
  } catch (e: any) {
    return c.json({ message: e.message || '操作失败' }, 500);
  }
}

export async function blockEmail(c: Context) {
  try {
    const { email } = await c.req.json();
    if (!email || typeof email !== 'string' || !email.trim()) {
      return c.json({ message: '邮箱不能为空' }, 400);
    }
    if (!isValidEmail(email.trim())) {
      return c.json({ message: '邮箱格式不正确' }, 400);
    }
    await addToBlockedList('email', email.trim());
    return c.json({ message: '已加入邮箱黑名单' });
  } catch (e: any) {
    return c.json({ message: e.message || '操作失败' }, 500);
  }
}

// ==================== 导出/导入：评论====================
export async function exportComments(c: Context) {
  try {
    const results = await queryAll<any>(
      `SELECT * FROM "Comment" ORDER BY priority DESC, created DESC`
    );
    return c.json(results);
  } catch (e: any) {
    return c.json({ message: e.message || '导出失败' }, 500);
  }
}

export async function importComments(c: Context) {
  try {
    const body = await c.req.json();
    const rawComments = Array.isArray(body) ? body : [body];

    if (rawComments.length === 0) {
      return c.json({ message: '导入数据为空' }, 400);
    }

    // Map Twikoo / Artalk / Valine data to VWD structure
    const comments = rawComments.map((item: any) => {
      const isValine = item.objectId !== undefined && item.insertedAt !== undefined && item.nick !== undefined;
      const isTwikoo = item.href !== undefined || item.comment !== undefined;
      const isArtalk = item.page_key !== undefined && item.content !== undefined;

      if (isValine) {
        let created = Date.now();
        if (item.insertedAt && item.insertedAt.iso) {
          created = new Date(item.insertedAt.iso).getTime();
        } else if (item.createdAt) {
          created = new Date(item.createdAt).getTime();
        }
        return {
          created,
          post_slug: item.url || '',
          post_url: item.url || '',
          name: item.nick || 'Anonymous',
          email: item.mail || '',
          url: item.link || null,
          ip_address: item.ip || null,
          device: null, os: null, browser: null,
          ua: item.ua || null,
          content_text: item.comment || '',
          content_html: item.comment || '',
          parent_id: null,
          status: 'approved',
          site_id: item.site_id,
        };
      }

      if (isArtalk) {
        let created = Date.now();
        if (item.created_at) created = new Date(item.created_at).getTime();
        return {
          created,
          post_slug: item.page_key || '',
          name: item.nick || 'Anonymous',
          email: item.email || '',
          url: item.link || null,
          ip_address: item.ip || null,
          device: null, os: null, browser: null,
          ua: item.ua || null,
          content_text: item.content || '',
          content_html: item.content || '',
          parent_id: null,
          status: 'approved',
          site_id: item.site_id,
        };
      }

      if (isTwikoo) {
        let created = Date.now();
        if (item.created) created = new Date(item.created).getTime();
        return {
          created,
          post_slug: item.href || '',
          name: item.nick || 'Anonymous',
          email: item.mail || '',
          url: item.link || null,
          ip_address: item.ip || null,
          device: null, os: null, browser: null,
          ua: item.ua || null,
          content_text: item.comment || '',
          content_html: item.comment || '',
          parent_id: null,
          status: 'approved',
          site_id: item.site_id,
        };
      }

      return item;
    });

    comments.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

    let imported = 0;
    for (const comment of comments) {
      try {
        await execute(
          `INSERT INTO "Comment" (created, post_slug, post_url, name, email, url, ip_address, os, browser, device, ua, content_text, content_html, parent_id, status, likes, site_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO UPDATE SET
             created = EXCLUDED.created, post_slug = EXCLUDED.post_slug, name = EXCLUDED.name,
             email = EXCLUDED.email, content_text = EXCLUDED.content_text, content_html = EXCLUDED.content_html,
             status = EXCLUDED.status`,
          [
            comment.created || Date.now(),
            comment.post_slug || '',
            comment.post_url || null,
            comment.name || 'Anonymous',
            comment.email || '',
            comment.url || null,
            comment.ip_address || null,
            comment.os || null,
            comment.browser || null,
            comment.device || null,
            comment.ua || null,
            comment.content_text || '',
            comment.content_html || '',
            comment.parent_id || null,
            comment.status || 'approved',
            typeof comment.likes === 'number' ? comment.likes : 0,
            comment.site_id || '',
          ]
        );
        imported++;
      } catch (e) {
        // Skip individual insert errors
        console.error('Import comment error:', e);
      }
    }

    return c.json({ message: `成功导入 ${imported} 条评论` });
  } catch (e: any) {
    console.error(e);
    return c.json({ message: e.message || '导入失败' }, 500);
  }
}

// ==================== 导出/导入：配置 ====================
export async function exportConfig(c: Context) {
  try {
    const results = await queryAll<{ key: string; value: string }>(`SELECT * FROM "Settings"`);
    return c.json(results);
  } catch (e: any) {
    return c.json({ message: e.message || '导出配置失败' }, 500);
  }
}

export async function importConfig(c: Context) {
  try {
    const body = await c.req.json();
    const configs = Array.isArray(body) ? body : [body];

    if (configs.length === 0) {
      return c.json({ message: '导入数据为空' }, 400);
    }

    const validConfigs = configs.filter((item: any) => item && item.key && typeof item.value === 'string');
    if (validConfigs.length === 0) {
      return c.json({ message: '没有有效的配置数据' }, 400);
    }

    for (const item of validConfigs) {
      await setSetting(item.key, item.value);
    }

    return c.json({ message: `成功导入 ${validConfigs.length} 条配置` });
  } catch (e: any) {
    console.error(e);
    return c.json({ message: e.message || '导入配置失败' }, 500);
  }
}

// ==================== 导出/导入：统计数据 ====================
export async function exportStats(c: Context) {
  try {
    const siteId = c.req.query('siteId');

    let likesQuery = 'SELECT * FROM "Likes"';
    const params: unknown[] = [];

    if (siteId) {
      likesQuery += ' WHERE site_id = $1';
      params.push(siteId);
    }

    const likes = await queryAll<any>(likesQuery, params);

    return c.json({ likes });
  } catch (e: any) {
    return c.json({ message: e.message || '导出统计数据失败' }, 500);
  }
}

export async function importStats(c: Context) {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') {
      return c.json({ message: '数据格式错误' }, 400);
    }

    let count = 0;

    if (Array.isArray(body.likes)) {
      for (const item of body.likes) {
        await execute(
          `INSERT INTO "Likes" (site_id, page_slug, user_id, created_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (site_id, page_slug, user_id) DO NOTHING`,
          [item.site_id || '', item.page_slug, item.user_id, item.created_at || Date.now()]
        );
        count++;
      }
    }

    return c.json({ message: `成功导入 ${count} 条统计数据` });
  } catch (e: any) {
    console.error(e);
    return c.json({ message: e.message || '导入统计数据失败' }, 500);
  }
}

// ==================== 全量导出/导入（备份） ====================
export async function exportBackup(c: Context) {
  try {
    const comments = await queryAll<any>(`SELECT * FROM "Comment" ORDER BY priority DESC, created DESC`);
    const configs = await queryAll<{ key: string; value: string }>(`SELECT * FROM "Settings"`);
    const likes = await queryAll<any>('SELECT * FROM "Likes"');

    return c.json({
      version: '1.0',
      timestamp: Date.now(),
      comments,
      settings: configs,
      likes,
    });
  } catch (e: any) {
    return c.json({ message: e.message || '全量导出失败' }, 500);
  }
}

export async function importBackup(c: Context) {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') {
      return c.json({ message: '数据格式错误' }, 400);
    }

    let message = '导入结果：';

    // 1. Comments
    if (Array.isArray(body.comments) && body.comments.length > 0) {
      let count = 0;
      for (const comment of body.comments) {
        try {
          await execute(
            `INSERT INTO "Comment" (created, post_slug, post_url, name, email, url, ip_address, os, browser, device, ua, content_text, content_html, parent_id, status, likes, site_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
              comment.created || Date.now(),
              comment.post_slug || '',
              comment.post_url || null,
              comment.name || 'Anonymous',
              comment.email || '',
              comment.url || null,
              comment.ip_address || null,
              comment.os || null,
              comment.browser || null,
              comment.device || null,
              comment.ua || null,
              comment.content_text || '',
              comment.content_html || '',
              comment.parent_id || null,
              comment.status || 'approved',
              typeof comment.likes === 'number' ? comment.likes : 0,
              comment.site_id || '',
            ]
          );
          count++;
        } catch (e) {
          console.error('Import backup comment error:', e);
        }
      }
      message += ` 评论 ${count} 条`;
    }

    // 2. Settings
    if (Array.isArray(body.settings) && body.settings.length > 0) {
      let count = 0;
      for (const item of body.settings) {
        if (item && item.key && typeof item.value === 'string') {
          await setSetting(item.key, item.value);
          count++;
        }
      }
      message += ` 配置 ${count} 条`;
    }

    // 3. Stats (likes only)
    let statsCount = 0;
    if (Array.isArray(body.likes)) {
      for (const item of body.likes) {
        await execute(
          `INSERT INTO "Likes" (site_id, page_slug, user_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [item.site_id || '', item.page_slug, item.user_id, item.created_at || Date.now()]
        );
        statsCount++;
      }
    }
    if (statsCount > 0) message += ` 点赞数据 ${statsCount} 条`;

    return c.json({ message });
  } catch (e: any) {
    console.error(e);
    return c.json({ message: e.message || '全量导入失败' }, 500);
  }
}

// ==================== Telegram 设置 ====================
const TG_BOT_TOKEN_KEY = 'telegram_bot_token';
const TG_CHAT_ID_KEY = 'telegram_chat_id';
const TG_NOTIFY_ENABLED_KEY = 'telegram_notify_enabled';

export async function getTelegramSettings(c: Context) {
  try {
    const settings = await getSettings([TG_BOT_TOKEN_KEY, TG_CHAT_ID_KEY, TG_NOTIFY_ENABLED_KEY]);
    return c.json({
      botToken: settings.get(TG_BOT_TOKEN_KEY) ?? null,
      chatId: settings.get(TG_CHAT_ID_KEY) ?? null,
      notifyEnabled: settings.get(TG_NOTIFY_ENABLED_KEY) === '1',
    });
  } catch (e: any) {
    return c.json({ message: e.message || '加载配置失败' }, 500);
  }
}

export async function saveTelegramSettingsHandler(c: Context) {
  try {
    const body = await c.req.json();
    const botToken = typeof body.botToken === 'string' ? body.botToken.trim() : null;
    const chatId = typeof body.chatId === 'string' ? body.chatId.trim() : null;
    const notifyEnabled = !!body.notifyEnabled;

    if (botToken) await setSetting(TG_BOT_TOKEN_KEY, botToken);
    else await deleteSetting(TG_BOT_TOKEN_KEY);
    if (chatId) await setSetting(TG_CHAT_ID_KEY, chatId);
    else await deleteSetting(TG_CHAT_ID_KEY);
    await setSetting(TG_NOTIFY_ENABLED_KEY, notifyEnabled ? '1' : '0');

    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '保存失败' }, 500);
  }
}

export async function setupTelegramWebhookHandler(c: Context) {
  try {
    const botToken = await getSetting(TG_BOT_TOKEN_KEY);
    if (!botToken) {
      return c.json({ message: '请先保存机器人 Token' }, 400);
    }

    const url = new URL(c.req.url);
    const webhookUrl = `${url.protocol}//${url.host}/api/telegram/webhook`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const result: any = await response.json();

    if (!result.ok) {
      return c.json({ message: `Webhook 设置失败: ${result.description}` }, 400);
    }

    return c.json({ message: 'Webhook 设置成功', webhookUrl });
  } catch (e: any) {
    return c.json({ message: e.message || '设置失败' }, 500);
  }
}

export async function testTelegramMessageHandler(c: Context) {
  try {
    const settings = await getSettings([TG_BOT_TOKEN_KEY, TG_CHAT_ID_KEY]);
    const botToken = settings.get(TG_BOT_TOKEN_KEY);
    const chatId = settings.get(TG_CHAT_ID_KEY);

    if (!botToken || !chatId) {
      return c.json({ message: '请先配置 Bot Token 和 Chat ID' }, 400);
    }

    const text = `VWD 评论系统测试消息\n时间: ${new Date().toISOString()}`;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    const result: any = await response.json();

    if (!result.ok) {
      return c.json({ message: `发送失败： ${result.description || '未知错误'}` }, 400);
    }

    return c.json({ message: '测试消息已发送' });
  } catch (e: any) {
    return c.json({ message: e.message || '发送失败：' }, 500);
  }
}

// ==================== S3 设置 ====================
const S3_CONFIG_KEY = 's3_config';

export async function getS3SettingsHandler(c: Context) {
  try {
    const row = await getSetting(S3_CONFIG_KEY);
    const defaults = { endpoint: '', accessKeyId: '', secretAccessKey: '', bucket: '', region: 'auto' };
    if (!row) return c.json(defaults);
    try {
      const parsed = JSON.parse(row);
      return c.json({
        endpoint: parsed.endpoint || '',
        accessKeyId: parsed.accessKeyId || '',
        secretAccessKey: parsed.secretAccessKey || '',
        bucket: parsed.bucket || '',
        region: parsed.region || 'auto',
      });
    } catch {
      return c.json(defaults);
    }
  } catch (e: any) {
    return c.json({ message: e.message || '加载 S3 配置失败' }, 500);
  }
}

export async function saveS3SettingsHandler(c: Context) {
  try {
    const body = await c.req.json();
    const settings = {
      endpoint: typeof body.endpoint === 'string' ? body.endpoint.trim() : '',
      accessKeyId: typeof body.accessKeyId === 'string' ? body.accessKeyId.trim() : '',
      secretAccessKey: typeof body.secretAccessKey === 'string' ? body.secretAccessKey.trim() : '',
      bucket: typeof body.bucket === 'string' ? body.bucket.trim() : '',
      region: typeof body.region === 'string' ? body.region.trim() : 'auto',
    };
    await setSetting(S3_CONFIG_KEY, JSON.stringify(settings));
    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '保存失败' }, 500);
  }
}

// ==================== S3 备份 ====================
async function getS3Client(): Promise<S3Client | null> {
  const row = await getSetting(S3_CONFIG_KEY);
  if (!row) return null;
  let settings: any;
  try { settings = JSON.parse(row); } catch { return null; }
  if (!settings.endpoint || !settings.bucket || !settings.accessKeyId || !settings.secretAccessKey) {
    return null;
  }
  return new S3Client({
    endpoint: settings.endpoint,
    accessKeyId: settings.accessKeyId,
    secretAccessKey: settings.secretAccessKey,
    bucket: settings.bucket,
    region: settings.region,
  });
}

export async function triggerS3BackupHandler(c: Context) {
  try {
    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ message: 'S3 配置不完整，请先配置 S3 信息' }, 400);
    }

    // Gather backup data
    const comments = await queryAll<any>(`SELECT * FROM "Comment" ORDER BY priority DESC, created DESC`);
    const configs = await queryAll<{ key: string; value: string }>(`SELECT * FROM "Settings"`);
    const likes = await queryAll<any>('SELECT * FROM "Likes"');

    const backupData = {
      version: '1.0',
      timestamp: Date.now(),
      comments,
      settings: configs,
      likes,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `vwd-backup-${dateStr}-${Date.now()}.json`;

    await s3.putObject(fileName, jsonString);

    return c.json({ message: '备份成功', file: fileName });
  } catch (e: any) {
    console.error('S3 Backup Error:', e);
    return c.json({ message: e.message || 'S3 备份失败' }, 500);
  }
}

export async function listS3BackupsHandler(c: Context) {
  try {
    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ message: 'S3 配置不完整' }, 400);
    }

    const files = await s3.listObjects('vwd-backup-');
    return c.json({ files });
  } catch (e: any) {
    return c.json({ message: e.message || '获取备份列表失败' }, 500);
  }
}

export async function deleteS3BackupHandler(c: Context) {
  try {
    const key = c.req.query('key');
    if (!key) return c.json({ message: '缺少 key 参数' }, 400);

    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ message: 'S3 配置不完整' }, 400);
    }

    await s3.deleteObject(key);
    return c.json({ message: '删除成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '删除备份失败' }, 500);
  }
}

export async function downloadS3BackupHandler(c: Context) {
  try {
    const key = c.req.query('key');
    if (!key) return c.json({ message: '缺少 key 参数' }, 400);

    const s3 = await getS3Client();
    if (!s3) {
      return c.json({ message: 'S3 配置不完整' }, 400);
    }

    const s3Response = await s3.getObject(key);
    const body = await s3Response.arrayBuffer();

    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="${key}"`);

    return c.body(body);
  } catch (e: any) {
    return c.json({ message: e.message || '下载备份失败' }, 500);
  }
}

// ==================== 站点管理 ====================
const MANAGED_SITES_KEY = 'managed_sites';

type ManagedSite = {
  id: string;
  name: string;
  url: string;
  siteId: string;
  isDefault?: boolean;
};

const DEFAULT_SITE_ID = '__default_site__';

async function getManagedSitesList(): Promise<ManagedSite[]> {
  const raw = await getSetting(MANAGED_SITES_KEY);
  let sites: ManagedSite[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      sites = Array.isArray(parsed) ? parsed : [];
    } catch {
      sites = [];
    }
  }
  // Auto-create default site if missing
  if (!sites.some(s => s.id === DEFAULT_SITE_ID)) {
    sites.unshift({
      id: DEFAULT_SITE_ID,
      name: '默认站点',
      url: '',
      siteId: 'default',
      isDefault: true,
    });
    await saveManagedSitesList(sites);
  }
  return sites;
}

async function saveManagedSitesList(sites: ManagedSite[]): Promise<void> {
  await setSetting(MANAGED_SITES_KEY, JSON.stringify(sites));
}

export async function getManagedSites(c: Context) {
  try {
    const sites = await getManagedSitesList();
    return c.json({ sites });
  } catch (e: any) {
    return c.json({ message: e.message || '获取站点列表失败' }, 500);
  }
}

export async function createManagedSite(c: Context) {
  try {
    const body = await c.req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';

    if (!name) return c.json({ message: '站点名称不能为空' }, 400);
    if (!siteId) return c.json({ message: '站点 ID 不能为空' }, 400);
    if (siteId === 'default') return c.json({ message: '站点 ID "default" 为系统保留，请使用其他 ID' }, 400);

    const sites = await getManagedSitesList();
    if (sites.some(s => s.siteId === siteId)) {
      return c.json({ message: '站点 ID 已存在，请使用其他 ID' }, 400);
    }

    const newSite: ManagedSite = {
      id: crypto.randomUUID(),
      name,
      url,
      siteId,
    };
    sites.push(newSite);
    await saveManagedSitesList(sites);

    return c.json({ message: '创建成功', data: newSite });
  } catch (e: any) {
    return c.json({ message: e.message || '创建站点失败' }, 500);
  }
}

export async function updateManagedSite(c: Context) {
  try {
    const body = await c.req.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) return c.json({ message: '缺少站点 ID' }, 400);

    const sites = await getManagedSitesList();
    const idx = sites.findIndex(s => s.id === id);
    if (idx === -1) return c.json({ message: '站点不存在' }, 404);

    const name = typeof body.name === 'string' ? body.name.trim() : sites[idx].name;
    const url = typeof body.url === 'string' ? body.url.trim() : sites[idx].url;
    const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : sites[idx].siteId;

    if (!name) return c.json({ message: '站点名称不能为空' }, 400);
    if (!siteId) return c.json({ message: '站点 ID 不能为空' }, 400);

    // Check siteId uniqueness (excluding current)
    if (sites.some((s, i) => i !== idx && s.siteId === siteId)) {
      return c.json({ message: '站点 ID 已存在，请使用其他 ID' }, 400);
    }

    sites[idx] = { ...sites[idx], name, url, siteId };
    await saveManagedSitesList(sites);

    return c.json({ message: '更新成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '更新站点失败' }, 500);
  }
}

export async function deleteManagedSite(c: Context) {
  try {
    const id = c.req.query('id');
    if (!id) return c.json({ message: '缺少 id 参数' }, 400);
    if (id === DEFAULT_SITE_ID) return c.json({ message: '默认站点不可删除' }, 400);

    const sites = await getManagedSitesList();
    const filtered = sites.filter(s => s.id !== id);
    if (filtered.length === sites.length) {
      return c.json({ message: '站点不存在' }, 404);
    }
    await saveManagedSitesList(filtered);

    return c.json({ message: '删除成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '删除站点失败' }, 500);
  }
}

// ==================== 说说管理 ====================
import { loadSaySettings, saveSaySettings as saveSaySettingsLib } from './saySettings.js';

export async function getAdminSays(c: Context) {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const status = c.req.query('status');
    const search = c.req.query('search');
    const siteId = c.req.query('site_id') || c.req.query('siteId');
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      where += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (search) {
      where += ` AND content_text ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (siteId && siteId !== 'default') {
      where += ` AND site_id = $${paramIndex++}`;
      params.push(siteId);
    }

    const countRow = await queryFirst<{ count: string }>(`SELECT COUNT(*) as count FROM "Say" WHERE ${where}`, params);
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
      pagination: { page, limit, total: Math.ceil(totalCount / limit), totalCount },
    });
  } catch (e: any) {
    return c.json({ message: e.message || '获取说说列表失败' }, 500);
  }
}

export async function createSay(c: Context) {
  try {
    const body = await c.req.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const status = typeof body.status === 'string' ? body.status : 'published';
    const tags = Array.isArray(body.tags) ? body.tags.filter((t: any) => typeof t === 'string' && t.trim()).map((t: string) => t.trim()) : [];
    const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';

    if (!content) return c.json({ message: '内容不能为空' }, 400);

    const contentWithEmoji = replaceEmotionSyntax(content);
    const html = await marked.parse(contentWithEmoji, { async: true });
    const contentHtml = xss(html, {
      whiteList: {
        ...xssWhiteList,
        code: ['class'], span: ['class', 'style'], pre: ['class'],
        div: ['class', 'style'],
        img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class', 'referrerpolicy', 'loading'],
      },
    });

    const result = await query<{ id: number }>(
      `INSERT INTO "Say" (created, content_text, content_html, status, tags, site_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [Date.now(), content, contentHtml, status, tags.join(',') || null, siteId]
    );

    const sayId = result.rows[0]?.id;
    return c.json({ message: '发布成功', data: { id: sayId } });
  } catch (e: any) {
    return c.json({ message: e.message || '发布说说失败' }, 500);
  }
}

export async function updateSay(c: Context) {
  try {
    const body = await c.req.json();
    const id = typeof body.id === 'number' ? body.id : parseInt(String(body.id), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return c.json({ message: 'Invalid id' }, 400);
    }

    const existing = await queryFirst<{ id: number }>(`SELECT id FROM "Say" WHERE id = $1`, [id]);
    if (!existing) return c.json({ message: '说说不存在' }, 404);

    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const status = typeof body.status === 'string' ? body.status : 'published';
    const tags = Array.isArray(body.tags) ? body.tags.filter((t: any) => typeof t === 'string' && t.trim()).map((t: string) => t.trim()) : [];

    if (!content) return c.json({ message: '内容不能为空' }, 400);

    const contentWithEmoji = replaceEmotionSyntax(content);
    const html = await marked.parse(contentWithEmoji, { async: true });
    const contentHtml = xss(html, {
      whiteList: {
        ...xssWhiteList,
        code: ['class'], span: ['class', 'style'], pre: ['class'],
        div: ['class', 'style'],
        img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class', 'referrerpolicy', 'loading'],
      },
    });

    const success = await execute(
      `UPDATE "Say" SET content_text = $1, content_html = $2, status = $3, tags = $4 WHERE id = $5`,
      [content, contentHtml, status, tags.join(',') || null, id]
    );

    if (!success) return c.json({ message: '更新失败' }, 500);
    return c.json({ message: '更新成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '更新说说失败' }, 500);
  }
}

export async function deleteSay(c: Context) {
  try {
    const id = c.req.query('id');
    if (!id) return c.json({ message: '缺少 id 参数' }, 400);

    const success = await execute(`DELETE FROM "Say" WHERE id = $1`, [id]);
    if (!success) return c.json({ message: '删除失败' }, 500);
    return c.json({ message: '删除成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '删除说说失败' }, 500);
  }
}

export async function updateSayStatus(c: Context) {
  try {
    const id = c.req.query('id');
    const status = c.req.query('status');
    if (!id || !status) return c.json({ message: '缺少 id 或 status 参数' }, 400);

    const success = await execute(`UPDATE "Say" SET status = $1 WHERE id = $2`, [status, id]);
    if (!success) return c.json({ message: '更新失败' }, 500);
    return c.json({ message: '状态更新成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '更新状态失败' }, 500);
  }
}

export async function getSaySettingsHandler(c: Context) {
  try {
    const settings = await loadSaySettings();
    return c.json(settings);
  } catch (e: any) {
    return c.json({ message: e.message || '加载说说配置失败' }, 500);
  }
}

export async function saveSaySettingsHandler(c: Context) {
  try {
    const body = await c.req.json();
    await saveSaySettingsLib({
      sayEnabled: typeof body.sayEnabled === 'boolean' ? body.sayEnabled : undefined,
      sayAllowComments: typeof body.sayAllowComments === 'boolean' ? body.sayAllowComments : undefined,
      sayPageSize: typeof body.sayPageSize === 'number' ? body.sayPageSize : undefined,
    });
    return c.json({ message: '保存成功' });
  } catch (e: any) {
    return c.json({ message: e.message || '保存失败' }, 500);
  }
}
