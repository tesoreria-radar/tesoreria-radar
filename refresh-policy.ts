export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const refreshModules = [
  "BCRA",
  "FX",
  "ARCA",
  "REAL_ESTATE",
  "VACA_MUERTA",
  "BCRA_CALENDAR",
] as const;

export function isFresh(observedAt?: string, now = Date.now()) {
  if (!observedAt) return false;
  return now - new Date(observedAt).getTime() <= REFRESH_INTERVAL_MS;
}
