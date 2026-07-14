/**
 * VWD Comment System - Vercel 入口
 * 所有 /api/* 请求通过 vercel.json rewrite 路由到这里
 * Hono 应用处理内部路由
 */
import { handle } from 'hono/vercel';
import { app } from '../lib/app.js';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
