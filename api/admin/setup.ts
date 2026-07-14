/**
 * 独立端点：管理员初始化设置
 * 不依赖 Hono，直接使用 Vercel Serverless Function
 */
import { ensureSchema, getSetting, setSetting } from '../../lib/db.js';
import { kvSet } from '../../lib/kv.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

    // 如果已经设置过管理员，拒绝再次设置
    const existing = await getSetting('admin_name');
    if (existing) {
      return new Response(JSON.stringify({ message: '管理员账户已初始化，如需修改请登录后在设置中操作' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const data = await req.json();
    const name = (data.name || '').trim();
    const password = data.password || '';

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ message: '用户名至少 2 个字符' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ message: '密码至少 6 个字符' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const passwordHash = await hashPassword(password);
    await setSetting('admin_name', name);
    await setSetting('admin_password_hash', passwordHash);

    // 自动登录，颁发 token
    const ip = getClientIp(req);
    const tempKey = crypto.randomUUID();
    await kvSet(`token:${tempKey}`, JSON.stringify({ user: name, ip }), 172800);

    return new Response(JSON.stringify({ data: { key: tempKey, message: '设置成功' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[Setup] error:', e);
    return new Response(JSON.stringify({ message: e.message || '设置失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
