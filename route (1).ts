import { NextResponse } from "next/server";

export async function GET() {
  // Adapter boundary: public ARCA calendar is intentionally kept separate
  // from authenticated Sistema de Cuentas Tributarias data.
  return NextResponse.json({
    source: "ARCA",
    status: "ready",
    personalizedAgenda: "requires authenticated connector",
    obligations: [],
    message: "Configure the ARCA adapter to persist current public deadlines and, when authorized, the company's personalized agenda."
  });
}
