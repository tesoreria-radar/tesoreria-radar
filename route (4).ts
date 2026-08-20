import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const horizon = [3, 7, 15, 30].filter((d) => d <= Math.max(days, 3));
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    horizons: horizon.map((d) => ({ days: d, obligations: [], totalByCurrency: {} })),
    status: "ready",
    note: "Populate from normalized ARCA/BCRA/company obligation records."
  });
}
