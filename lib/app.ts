/**
 * Hono App - 路由定义
 * 被 api/index.ts 引用，处理所有 /api/* 路由
 */
import { Hono } from 'hono';
import { adminAuth } from './auth.js';
import { ensureSchema } from './db.js';
import {
  getComments, postComment, verifyAdminKey,
  getLikeStatus, likePage,
  likeComment,
  getPublicConfig,
} from '../src/public.js';
import {
  getSays, getSayById, likeSay,
} from '../src/say.js';
import {
  adminLogin, getAdminComments, deleteComment, updateStatus,
  updateComment, getStats, getVisitOverview, getVisitPages,
  getSiteList, getLikeStats, listLikes,
  getAdminSays, createSay, updateSay, deleteSay, updateSayStatus,
  getSaySettingsHandler, saveSaySettingsHandler,
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
} from '../src/admin.js';

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

app.get('/api/config/comments', getPublicConfig);

// ==================== Says (Moments) Public API ====================
app.get('/api/says', getSays);
app.get('/api/says/:id', getSayById);
app.post('/api/says/like', likeSay);

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

// Stats
app.get('/api/admin/stats/comments', adminAuth, getStats);
app.get('/api/admin/stats/sites', adminAuth, getSiteList);

// Says management
app.get('/api/admin/says/list', adminAuth, getAdminSays);
app.post('/api/admin/says/create', adminAuth, createSay);
app.put('/api/admin/says/update', adminAuth, updateSay);
app.delete('/api/admin/says/delete', adminAuth, deleteSay);
app.put('/api/admin/says/status', adminAuth, updateSayStatus);
app.get('/api/admin/settings/says', adminAuth, getSaySettingsHandler);
app.put('/api/admin/settings/says', adminAuth, saveSaySettingsHandler);

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

// ==================== Debug catch-all ====================
app.all('*', (c) => {
  return c.json({
    message: 'Route not found',
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
  }, 404);
});

export { app };
