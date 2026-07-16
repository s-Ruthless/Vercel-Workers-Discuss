/**
 * VWD Comment System - Vercel API 入口
 * 所有 /api/* 请求（除 /api/health 外）通过 vercel.json rewrite 路由到这里
 * Hono 应用根据原始 URL 进行内部路由
 */
import { handle } from 'hono/vercel';
import { app } from '../server/app.js';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
