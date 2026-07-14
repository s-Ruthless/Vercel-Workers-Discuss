/**
 * 独立端点：管理员登录
 * 不依赖 Hono，直接使用 Vercel Serverless Function
 */
import { ensureSchema, getSetting } from '../../lib/db.js';
import { kvGet, kvSet, kvDelete } from '../../lib/kv.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60;

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

let schemaReady = false;

export async function POST(req: Request) {
  try {
    if (!schemaReady) {
      schemaReady = true;
      try { await ensureSchema(); } catch (e) { console.error('[DB] init failed:', e); }
    }

    const data = await req.json();
    const ip = getClientIp(req);

    const blockKey = `block:${ip}`;
    const attemptKey = `attempts:${ip}`;

    const isBlocked = await kvGet(blockKey);
    if (isBlocked) {
      return new Response(JSON.stringify({ message: 'IP 已被封禁，30 分钟后重试' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const adminName = await getSetting('admin_name');
    const adminPasswordHash = await getSetting('admin_password_hash');

    if (!adminName || !adminPasswordHash) {
      return new Response(JSON.stringify({ message: '管理员账户尚未初始化，请先完成初始设置', needSetup: true }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const inputHash = await hashPassword(data.password || '');
    const isValid = data.name === adminName && inputHash === adminPasswordHash;

    if (!isValid) {
      const attempts = parseInt((await kvGet(attemptKey)) || '0') + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await kvSet(blockKey, '1', LOCK_TIME);
        await kvDelete(attemptKey);
        return new Response(JSON.stringify({ message: 'IP 已被封禁，30 分钟后重试' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        await kvSet(attemptKey, attempts.toString(), 600);
        return new Response(JSON.stringify({ message: '用户名或密码无效', failedAttempts: attempts }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    await kvDelete(attemptKey);
    const tempKey = crypto.randomUUID();
    await kvSet(`token:${tempKey}`, JSON.stringify({ user: data.name, ip }), 172800);

    return new Response(JSON.stringify({ data: { key: tempKey } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[Login] error:', e);
    return new Response(JSON.stringify({ message: e.message || '登录失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
