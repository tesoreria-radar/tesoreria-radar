export async function GET() {
  return Response.json({
    ok: true,
    status: 'operational',
    checkedAt: new Date().toISOString(),
    refreshEverySeconds: 300,
    staleAfterSeconds: 600,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
