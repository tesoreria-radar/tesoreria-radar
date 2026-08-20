export type Impact = "ALTO" | "MEDIO" | "BAJO" | "INFORMATIVO";

export function scoreEvent(text: string): Impact {
  const t = text.toLowerCase();
  const high = ["comunicación a", "mulc", "mercado de cambios", "prórroga", "vencimiento", "rigi", "vaca muerta", "financiación en dólares"];
  const medium = ["tasas", "real estate", "hipotecario", "construcción", "energía", "ganancias", "iva"];
  if (high.some(k => t.includes(k))) return "ALTO";
  if (medium.some(k => t.includes(k))) return "MEDIO";
  return "INFORMATIVO";
}
