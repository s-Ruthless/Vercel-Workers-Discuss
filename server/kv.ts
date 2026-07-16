/**
 * Vercel KV 封装 - 管理员鉴权、登录限流
 */
import { kv } from '@vercel/kv';

export async function kvGet(key: string): Promise<string | null> {
  return await kv.get(key);
}

export async function kvSet(key: string, value: string, ttl?: number): Promise<void> {
  if (ttl) {
    await kv.set(key, value, { ex: ttl });
  } else {
    await kv.set(key, value);
  }
}

export async function kvDelete(key: string): Promise<void> {
  await kv.del(key);
}
