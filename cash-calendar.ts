export type Currency = "ARS" | "USD" | "OTHER";
export type Obligation = {
  id: string;
  source: "ARCA" | "BCRA" | "COMPANY";
  title: string;
  dueDate: string;
  currency: Currency;
  amount?: number;
  status: "PENDING" | "PAID" | "UNKNOWN";
  cuitEnding?: string;
  sourceUrl?: string;
};

export function horizons(obligations: Obligation[], now = new Date()) {
  const base = now.getTime();
  const windows = [3, 7, 15, 30];
  return windows.map(days => ({
    days,
    obligations: obligations.filter(o => {
      const delta = (new Date(o.dueDate).getTime() - base) / 86400000;
      return delta >= 0 && delta <= days;
    })
  }));
}
