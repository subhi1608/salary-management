export const COUNTRIES: { code: string; weight: number }[] = [
  { code: 'US', weight: 35 },
  { code: 'UK', weight: 20 },
  { code: 'IN', weight: 20 },
  { code: 'DE', weight: 10 },
  { code: 'CA', weight: 7 },
  { code: 'AU', weight: 5 },
  { code: 'SG', weight: 3 },
];

export function pickWeightedCountry(rand: number): string {
  const total = COUNTRIES.reduce((s, c) => s + c.weight, 0);
  let cumulative = 0;
  for (const c of COUNTRIES) {
    cumulative += c.weight / total;
    if (rand < cumulative) return c.code;
  }
  return COUNTRIES[COUNTRIES.length - 1].code;
}
