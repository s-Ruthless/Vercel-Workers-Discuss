// 独立健康检查端点 — 不依赖任何外部模块
export function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: Date.now(),
    database: process.env.POSTGRES_URL ? 'configured' : 'not_configured',
    kv: process.env.KV_REST_API_URL ? 'configured' : 'not_configured',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
