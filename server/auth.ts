/**
 * 管理员鉴权中间件
 */
import { Context, Next } from 'hono';
import { kvGet } from './kv.js';

export const adminAuth = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ message: 'Unauthorized' }, 401);

  const sessionData = await kvGet(`token:${token}`);
  if (!sessionData) {
    return c.json({ message: 'Token expired or invalid' }, 401);
  }

  await next();
};
