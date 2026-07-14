/**
 * Admin 子目录 catch-all
 * Vercel 不会从 api/admin/ 子目录回退到根目录的 [[...route]].ts
 * 因此需要在此处放置 catch-all，处理未被独立文件覆盖的 admin 路由
 *
 * 独立文件（优先匹配）：
 * - api/admin/setup-status.ts → GET  /api/admin/setup-status
 * - api/admin/setup.ts        → POST /api/admin/setup
 * - api/admin/login.ts        → POST /api/admin/login
 *
 * 其余 /api/admin/* 路由由此 catch-all 处理
 */
import { handle } from 'hono/vercel';
import { app } from '../../lib/app.js';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
