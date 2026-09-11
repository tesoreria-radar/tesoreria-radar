import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(`${origin}/api/treasury/alerts`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`ALERTS HTTP ${response.status}`);
    const data = await response.json();
    const alerts = Array.isArray(data.alerts) ? data.alerts : [];
    const top = alerts.slice(0, 5).map((a: any) => ({ id: a.id, level: a.level, title: a.title, action: a.action, daysUntil: a.daysUntil }));
    return NextResponse.json({ ok: true, checkedAt, summary: data.summary ?? { total: 0, critical: 0, high: 0, medium: 0 }, top });
  } catch (error) {
    return NextResponse.json({ ok: false, checkedAt, summary: { total: 0, critical: 0, high: 0, medium: 0 }, top: [], error: error instanceof Error ? error.message : 'Alert summary unavailable' }, { status: 502 });
  }
}
