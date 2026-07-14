/**
 * 独立端点：检查管理员初始化状态
 * 不依赖 Hono，直接使用 Vercel Serverless Function
 */
import { ensureSchema, getSetting } from '../../lib/db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

let schemaReady = false;

export async function GET(req: Request) {
  try {
    if (!schemaReady) {
      schemaReady = true;
      try { await ensureSchema(); } catch (e) { console.error('[DB] init failed:', e); }
    }
    const adminName = await getSetting('admin_name');
    return new Response(JSON.stringify({ setupCompleted: !!adminName }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ setupCompleted: false, error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
