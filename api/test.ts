// 最简测试端点 — 不依赖任何外部模块
export function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'test endpoint works',
    hasPostgres: !!process.env.POSTGRES_URL,
    hasKv: !!process.env.KV_REST_API_URL,
    time: Date.now(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
