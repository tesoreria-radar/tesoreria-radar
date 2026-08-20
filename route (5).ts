import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Production adapters should execute in parallel:
  // BCRA -> FX -> ARCA -> Real Estate -> Vaca Muerta -> BCRA calendar.
  // Each adapter persists normalized records and a source timestamp.
  const refreshedAt = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    refreshedAt,
    cadence: "5m",
    modules: ["BCRA", "FX", "ARCA", "REAL_ESTATE", "VACA_MUERTA", "BCRA_CALENDAR"],
  });
}
