import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  return NextResponse.json({
    ok: true,
    service: "tesoreria-radar",
    environment: process.env.VERCEL_ENV ?? "local",
    checkedAt: now.toISOString(),
    refreshEverySeconds: 300,
    staleAfterSeconds: 600,
    modules: {
      bcra: "configured",
      fx: "configured",
      arca: "public-calendar-ready",
      arcaPersonalized: "connector-required",
      realEstate: "configured",
      vacaMuerta: "configured",
      cashCalendar: "configured",
    },
  });
}
