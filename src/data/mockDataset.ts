import type { DataRow } from '@/types';

const PRODUCTS = [
  'Basmati Rice 5 kg',
  'Whole Wheat Atta 10 kg',
  'Masala Chai 500 g',
  'Filter Coffee 250 g',
  'Mustard Oil 1 L',
  'Desi Cow Ghee 1 L',
  'Toor Dal 1 kg',
  'Jaggery Powder 1 kg',
];

// Metro weights roughly proportional to addressable online-grocery demand
const METROS: { name: string; weight: number }[] = [
  { name: 'Mumbai', weight: 0.19 },
  { name: 'Delhi NCR', weight: 0.21 },
  { name: 'Bengaluru', weight: 0.14 },
  { name: 'Hyderabad', weight: 0.11 },
  { name: 'Chennai', weight: 0.1 },
  { name: 'Kolkata', weight: 0.09 },
  { name: 'Pune', weight: 0.09 },
  { name: 'Ahmedabad', weight: 0.07 },
];

// Deterministic PRNG so the sample dataset is stable across reloads
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMetro(rand: () => number): string {
  let x = rand();
  for (const m of METROS) {
    x -= m.weight;
    if (x <= 0) return m.name;
  }
  return METROS[0].name;
}

// Indian retail seasonality for the week containing `d`:
// Diwali rush (Oct–Nov), Sankranti/wedding season (Jan), Holi (Mar),
// monsoon lull (Jun–Aug).
function seasonalFactor(isoDate: string): number {
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  // Diwali fortnight
  if (month === 10 && day >= 15) return 1.55;
  if (month === 11 && day <= 15) return 1.35;
  if (month === 11) return 1.15;
  if (month === 1) return 1.12;
  if (month === 3) return 1.1;
  if (month >= 6 && month <= 8) return 0.92;
  return 1.0;
}

export function generateMockDataset(rows = 120): DataRow[] {
  const rand = mulberry32(42);
  const out: DataRow[] = [];
  // 120 weeks ending Monday 28 Sep 2026
  const end = new Date('2026-09-28T00:00:00Z');
  for (let i = 0; i < rows; i++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - (rows - 1 - i) * 7);
    const iso = d.toISOString().slice(0, 10);
    const growth = 1 + i * 0.0045;
    const noise = 0.88 + rand() * 0.24;
    const revenue = Math.round(4200000 * seasonalFactor(iso) * growth * noise);
    const aov = 950 + rand() * 450;
    const units = Math.round(revenue / aov);
    const customersAcquired = Math.round(units * (0.24 + rand() * 0.1));
    const conversionRate = +(2.2 + rand() * 3.4).toFixed(1);
    const churnRate = +(1 + rand() * 2.8).toFixed(1);
    const customerSatisfaction = +(71 + rand() * 22).toFixed(1);
    const marketingSpend = Math.round(revenue * (0.16 + rand() * 0.12));
    const websiteTraffic = Math.round(units * (26 + rand() * 18));
    // Two genuine demand shocks (festive spillover) for anomaly detection
    const spike = i === 41 || i === 97;
    out.push({
      id: i + 1,
      date: iso,
      productName: PRODUCTS[i % PRODUCTS.length],
      region: pickMetro(rand),
      revenue: spike ? Math.round(revenue * 2.0) : revenue,
      units: spike ? Math.round(units * 1.8) : units,
      customersAcquired,
      conversionRate,
      churnRate: i === 63 ? 9.8 : churnRate,
      customerSatisfaction: i === 88 ? 31.6 : customerSatisfaction,
      marketingSpend,
      websiteTraffic,
    });
  }
  return out;
}

export const MOCK_DATASET: DataRow[] = generateMockDataset();

export const NUMERIC_COLUMNS = [
  'revenue',
  'units',
  'customersAcquired',
  'conversionRate',
  'churnRate',
  'customerSatisfaction',
  'marketingSpend',
  'websiteTraffic',
] as const;

export const ALL_COLUMNS = [
  'id',
  'date',
  'productName',
  'region',
  'revenue',
  'units',
  'customersAcquired',
  'conversionRate',
  'churnRate',
  'customerSatisfaction',
  'marketingSpend',
  'websiteTraffic',
] as const;
