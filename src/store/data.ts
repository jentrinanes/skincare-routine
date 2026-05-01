import type { AppStore } from '../types';

export const ACTIVES_LIST: string[] = [
  'Retinol', 'Retinaldehyde', 'Tretinoin', 'Bakuchiol',
  'Vitamin C (L-AA)', 'Vitamin C (MAP)', 'Vitamin C (AA2G)',
  'Niacinamide', 'Zinc PCA',
  'AHA – Glycolic Acid', 'AHA – Lactic Acid', 'AHA – Mandelic Acid',
  'BHA – Salicylic Acid', 'PHA – Gluconolactone', 'PHA – Lactobionic Acid',
  'Azelaic Acid', 'Benzoyl Peroxide',
  'Alpha Arbutin', 'Kojic Acid', 'Tranexamic Acid',
  'Hyaluronic Acid', 'Polyglutamic Acid',
  'Ceramides', 'Squalane', 'Peptides', 'Copper Peptides',
  'Collagen', 'Exosomes',
  'Centella Asiatica', 'Madecassoside', 'Snail Mucin',
  'Allantoin', 'Panthenol (B5)', 'Adenosine', 'Resveratrol',
  'Ferulic Acid', 'Coenzyme Q10',
];

export const PRODUCT_TYPES: string[] = [
  'Cleanser', 'Toner', 'Essence', 'Serum', 'Moisturiser',
  'Eye Cream', 'Sunscreen', 'Exfoliant', 'Treatment', 'Oil',
  'Mist', 'Balm', 'Mask', 'Patch', 'Other',
];

export const PAO_OPTIONS: number[] = [3, 6, 9, 12, 18, 24, 36];

export const FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'daily',     label: 'Every day' },
  { value: 'alternate', label: 'Every other day' },
  { value: '3rd-day',  label: 'Every 3rd day' },
  { value: '2x-week',  label: '2× per week' },
  { value: '1x-week',  label: '1× per week' },
];

export const SKIN_TYPES: string[] = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];

const ACTIVE_WEIGHTS: Record<string, number> = {
  'Retinol': 2, 'Retinaldehyde': 2, 'Tretinoin': 3, 'Bakuchiol': 0,
  'Vitamin C (L-AA)': 2, 'Vitamin C (MAP)': 1, 'Vitamin C (AA2G)': 1,
  'AHA – Glycolic Acid': 2, 'AHA – Lactic Acid': 2, 'AHA – Mandelic Acid': 1,
  'BHA – Salicylic Acid': 2, 'PHA – Gluconolactone': 1, 'PHA – Lactobionic Acid': 1,
  'Azelaic Acid': 1, 'Benzoyl Peroxide': 2,
  'Niacinamide': 0, 'Zinc PCA': 0,
  'Alpha Arbutin': 0, 'Kojic Acid': 1, 'Tranexamic Acid': 0,
  'Hyaluronic Acid': 0, 'Polyglutamic Acid': 0,
  'Ceramides': 0, 'Squalane': 0, 'Peptides': 0, 'Copper Peptides': 1,
  'Collagen': 0, 'Exosomes': 0,
  'Centella Asiatica': 0, 'Madecassoside': 0, 'Snail Mucin': 0,
  'Allantoin': 0, 'Panthenol (B5)': 0, 'Adenosine': 0, 'Resveratrol': 0,
  'Ferulic Acid': 0, 'Coenzyme Q10': 0,
};

export function computeBarrierLoad(actives: string[]): number {
  return actives.reduce((sum, a) => sum + (ACTIVE_WEIGHTS[a] ?? 0), 0);
}

export function barrierLoadLabel(score: number): { label: string; color: string } {
  if (score === 0) return { label: 'Gentle',   color: 'sage' };
  if (score <= 2)  return { label: 'Moderate', color: 'cream' };
  if (score <= 4)  return { label: 'Active',   color: 'yellow' };
  return                  { label: 'High',     color: 'terra' };
}

export function computeExpiry(openedDate: string | null, paoMonths: number): string | null {
  if (!openedDate || !paoMonths) return null;
  const d = new Date(openedDate);
  d.setMonth(d.getMonth() + paoMonths);
  return d.toISOString().split('T')[0];
}

export function computeStreak(logs: AppStore['logs']): number {
  const completedDates = new Set(logs.filter(l => l.completed).map(l => l.date));
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (completedDates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function longestStreak(logs: AppStore['logs']): number {
  const completedDates = [...new Set(logs.filter(l => l.completed).map(l => l.date))].sort();
  if (!completedDates.length) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]!);
    const curr = new Date(completedDates[i]!);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

export function getTodayInTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(new Date());
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function loadStore(): AppStore {
  return {
    user: null,
    products: [],
    routine: [],
    logs: [],
    reactions: [],
    patchTests: [],
    darkMode: false,
    skinTypes: SKIN_TYPES,
    userProfile: {
      name: '',
      skinType: 'Normal',
      email: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  };
}
