import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "ready",
    sections: [
      "Alertas críticas",
      "BCRA / Regulación",
      "Mercado cambiario",
      "ARCA / Impuestos",
      "Cash Calendar 3/7/15/30 días",
      "Real Estate",
      "Vaca Muerta / Energía",
      "Economía",
      "Próximos informes BCRA"
    ]
  });
}
