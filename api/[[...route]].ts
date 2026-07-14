/**
 * VWD Comment System - Vercel 入口
 * 使用 Hono 框架 + Vercel adapter
 * 所有 API 路由通过 /api/ 前缀访问
 *
 * 路由路径与 cwd-api (Cloudflare Workers) 完全兼容，
 * 确保前端 widget 和 admin 无需修改即可切换到 Vercel。
 */
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { adminAuth } from '../lib/auth.js';
import { ensureSchema } from '../lib/db.js';
import {
  getComments, postComment, verifyAdminKey,
  trackVisit, getPagePv,
  getLikeStatus, likePage,
  likeComment,
  getPublicConfig, getEmotions,
} from './public.js';
import {
  adminLogin, getAdminComments, deleteComment, updateStatus,
  updateComment, getStats, getVisitOverview, getVisitPages,
  getSiteList, getLikeStats, listLikes,
  getCommentSettings, saveCommentSettings,
  getAdminEmail, setAdminEmail,
  getEmailNotifySettings, saveEmailNotifySettings,
  sendTestEmailHandler,
  getFeatureSettings, updateFeatureSettings,
  getAdminDisplaySettings, saveAdminDisplaySettings,
  blockIp, blockEmail,
  exportComments, importComments,
  exportConfig, importConfig,
  exportStats, importStats,
  exportBackup, importBackup,
  getTelegramSettings, saveTelegramSettingsHandler,
  setupTelegramWebhookHandler, testTelegramMessageHandler,
  getS3SettingsHandler, saveS3SettingsHandler,
  triggerS3BackupHandler, listS3BackupsHandler,
  deleteS3BackupHandler, downloadS3BackupHandler,
  checkSetupStatus, setupAdmin,
} from './admin.js';

// Initialize schema on first cold start
let schemaInitialized = false;

const app = new Hono();

// ==================== Global Error Handler ====================
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ message: 'Internal Server Error', error: err.message }, 500);
});

// ==================== CORS & Options ====================
app.use('*', async (c, next) => {
  try {
    // Skip DB initialization for health check
    const path = c.req.path;
    if (path !== '/api/health' && !schemaInitialized) {
      schemaInitialized = true;
      try {
        await ensureSchema();
      } catch (e) {
        console.error('[DB] Schema init failed:', e);
      }
    }
  } catch (e) {
    console.error('[Middleware] error:', e);
  }
  await next();
});

app.options('*', (c) => {
  return c.body(null, 204);
});

// ==================== Public API ====================
app.get('/api/comments', getComments);
app.post('/api/comments', postComment);
app.post('/api/comments/like', likeComment);
app.delete('/api/comments/like', likeComment);
app.post('/api/verify-admin', verifyAdminKey);

app.get('/api/like', getLikeStatus);
app.post('/api/like', likePage);

app.post('/api/analytics/visit', trackVisit);
app.get('/api/analytics/pv', getPagePv);

app.get('/api/emotions', getEmotions);
app.get('/api/config/comments', getPublicConfig);

// ==================== Admin API ====================
// Setup (no auth required, only works once)
app.get('/api/admin/setup-status', checkSetupStatus);
app.post('/api/admin/setup', setupAdmin);

// Login (no auth required)
app.post('/api/admin/login', adminLogin);

// Comments management
app.get('/api/admin/comments/list', adminAuth, getAdminComments);
app.delete('/api/admin/comments/delete', adminAuth, deleteComment);
app.put('/api/admin/comments/status', adminAuth, updateStatus);
app.put('/api/admin/comments/update', adminAuth, updateComment);
app.post('/api/admin/comments/block-ip', adminAuth, blockIp);
app.post('/api/admin/comments/block-email', adminAuth, blockEmail);

// Export / Import
app.get('/api/admin/comments/export', adminAuth, exportComments);
app.post('/api/admin/comments/import', adminAuth, importComments);
app.get('/api/admin/export/config', adminAuth, exportConfig);
app.post('/api/admin/import/config', adminAuth, importConfig);
app.get('/api/admin/export/stats', adminAuth, exportStats);
app.post('/api/admin/import/stats', adminAuth, importStats);
app.get('/api/admin/export/backup', adminAuth, exportBackup);
app.post('/api/admin/import/backup', adminAuth, importBackup);

// Stats & Analytics
app.get('/api/admin/stats/comments', adminAuth, getStats);
app.get('/api/admin/stats/sites', adminAuth, getSiteList);
app.get('/api/admin/analytics/overview', adminAuth, getVisitOverview);
app.get('/api/admin/analytics/pages', adminAuth, getVisitPages);

// Likes management
app.get('/api/admin/likes/list', adminAuth, listLikes);
app.get('/api/admin/likes/stats', adminAuth, getLikeStats);

// Settings - comments
app.get('/api/admin/settings/comments', adminAuth, getCommentSettings);
app.put('/api/admin/settings/comments', adminAuth, saveCommentSettings);

// Settings - email (admin notify email)
app.get('/api/admin/settings/email', adminAuth, getAdminEmail);
app.put('/api/admin/settings/email', adminAuth, setAdminEmail);

// Settings - email notify (SMTP)
app.get('/api/admin/settings/email-notify', adminAuth, getEmailNotifySettings);
app.put('/api/admin/settings/email-notify', adminAuth, saveEmailNotifySettings);
app.post('/api/admin/settings/email-test', adminAuth, sendTestEmailHandler);

// Settings - features
app.get('/api/admin/settings/features', adminAuth, getFeatureSettings);
app.put('/api/admin/settings/features', adminAuth, updateFeatureSettings);

// Settings - admin display
app.get('/api/admin/settings/admin-display', adminAuth, getAdminDisplaySettings);
app.put('/api/admin/settings/admin-display', adminAuth, saveAdminDisplaySettings);

// Settings - telegram
app.get('/api/admin/settings/telegram', adminAuth, getTelegramSettings);
app.put('/api/admin/settings/telegram', adminAuth, saveTelegramSettingsHandler);
app.post('/api/admin/settings/telegram/setup', adminAuth, setupTelegramWebhookHandler);
app.post('/api/admin/settings/telegram/test', adminAuth, testTelegramMessageHandler);

// Settings - S3
app.get('/api/admin/settings/s3', adminAuth, getS3SettingsHandler);
app.put('/api/admin/settings/s3', adminAuth, saveS3SettingsHandler);

// S3 Backup
app.post('/api/admin/backup/s3', adminAuth, triggerS3BackupHandler);
app.get('/api/admin/backup/s3/list', adminAuth, listS3BackupsHandler);
app.delete('/api/admin/backup/s3', adminAuth, deleteS3BackupHandler);
app.get('/api/admin/backup/s3/download', adminAuth, downloadS3BackupHandler);

// ==================== Health check ====================
app.get('/api/health', (c) => {
  const hasPostgres = !!process.env.POSTGRES_URL;
  const hasKv = !!process.env.KV_REST_API_URL;
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    database: hasPostgres ? 'connected' : 'not_configured',
    kv: hasKv ? 'connected' : 'not_configured',
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
