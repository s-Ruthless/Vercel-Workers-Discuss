/**
 * VWD Comment System - Vercel 入口 (catch-all)
 * 处理所有 /api/* 路由（api/ 子目录下的独立文件除外）
 */
import { handle } from 'hono/vercel';
import { app } from '../lib/app.js';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
