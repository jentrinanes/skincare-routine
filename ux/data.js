// ── Skincare Routine · Data Store ──────────────────────────────────────────
// All data lives in localStorage under 'skincareApp'

const ACTIVES_LIST = [
  'Retinol','Retinaldehyde','Tretinoin','Bakuchiol',
  'Vitamin C (L-AA)','Vitamin C (MAP)','Vitamin C (AA2G)',
  'Niacinamide','Zinc PCA',
  'AHA – Glycolic Acid','AHA – Lactic Acid','AHA – Mandelic Acid',
  'BHA – Salicylic Acid','PHA – Gluconolactone','PHA – Lactobionic Acid',
  'Azelaic Acid','Benzoyl Peroxide',
  'Alpha Arbutin','Kojic Acid','Tranexamic Acid',
  'Hyaluronic Acid','Polyglutamic Acid',
  'Ceramides','Squalane','Peptides','Copper Peptides',
  'Collagen','Exosomes',
  'Centella Asiatica','Madecassoside','Snail Mucin',
  'Allantoin','Panthenol (B5)','Adenosine','Resveratrol',
  'Ferulic Acid','Coenzyme Q10',
];

const PRODUCT_TYPES = [
  'Cleanser','Toner','Essence','Serum','Moisturiser',
  'Eye Cream','Sunscreen','Exfoliant','Treatment','Oil',
  'Mist','Balm','Mask','Patch','Other',
];

const PAO_OPTIONS = [3,6,9,12,18,24,36];

const FREQUENCY_OPTIONS = [
  { value:'daily',      label:'Every day' },
  { value:'alternate',  label:'Every other day' },
  { value:'2x-week',   label:'2× per week' },
  { value:'1x-week',   label:'1× per week' },
];

// Barrier load scoring per active
const ACTIVE_WEIGHTS = {
  'Retinol':2,'Retinaldehyde':2,'Tretinoin':3,'Bakuchiol':0,
  'Vitamin C (L-AA)':2,'Vitamin C (MAP)':1,'Vitamin C (AA2G)':1,
  'AHA – Glycolic Acid':2,'AHA – Lactic Acid':2,'AHA – Mandelic Acid':1,
  'BHA – Salicylic Acid':2,'PHA – Gluconolactone':1,'PHA – Lactobionic Acid':1,
  'Azelaic Acid':1,'Benzoyl Peroxide':2,
  'Niacinamide':0,'Zinc PCA':0,
  'Alpha Arbutin':0,'Kojic Acid':1,'Tranexamic Acid':0,
  'Hyaluronic Acid':0,'Polyglutamic Acid':0,
  'Ceramides':0,'Squalane':0,'Peptides':0,'Copper Peptides':1,
  'Collagen':0,'Exosomes':0,
  'Centella Asiatica':0,'Madecassoside':0,'Snail Mucin':0,
  'Allantoin':0,'Panthenol (B5)':0,'Adenosine':0,'Resveratrol':0,
  'Ferulic Acid':0,'Coenzyme Q10':0,
};

function computeBarrierLoad(actives = []) {
  return actives.reduce((sum, a) => sum + (ACTIVE_WEIGHTS[a] ?? 0), 0);
}

function barrierLoadLabel(score) {
  if (score === 0) return { label:'Gentle', color:'sage' };
  if (score <= 2)  return { label:'Moderate', color:'cream' };
  if (score <= 4)  return { label:'Active', color:'yellow' };
  return                { label:'High', color:'terra' };
}

function computeExpiry(openedDate, paoMonths) {
  if (!openedDate || !paoMonths) return null;
  const d = new Date(openedDate);
  d.setMonth(d.getMonth() + paoMonths);
  return d.toISOString().split('T')[0];
}

// ── Sample Data ─────────────────────────────────────────────────────────────
const SAMPLE_PRODUCTS = [
  { id:'p1', name:'Hydrating Facial Cleanser', brand:'CeraVe', type:'Cleanser',
    status:'active', openedDate:'2025-12-01', pao:12, actives:['Ceramides','Panthenol (B5)','Hyaluronic Acid'], notes:'' },
  { id:'p2', name:'2% BHA Liquid Exfoliant', brand:"Paula's Choice", type:'Exfoliant',
    status:'active', openedDate:'2025-12-15', pao:12, actives:['BHA – Salicylic Acid'], notes:'Start slow — 3x/week' },
  { id:'p3', name:'Niacinamide 10% + Zinc 1%', brand:'The Ordinary', type:'Serum',
    status:'active', openedDate:'2026-01-05', pao:12, actives:['Niacinamide','Zinc PCA'], notes:'' },
  { id:'p4', name:'Retinol 0.5% in Squalane', brand:'The Ordinary', type:'Treatment',
    status:'active', openedDate:'2026-02-01', pao:12, actives:['Retinol','Squalane'], notes:'Only PM' },
  { id:'p5', name:'Toleriane Double Repair SPF', brand:'La Roche-Posay', type:'Moisturiser',
    status:'active', openedDate:'2025-11-20', pao:12, actives:['Ceramides'], notes:'' },
  { id:'p6', name:'UV Clear SPF 46', brand:'EltaMD', type:'Sunscreen',
    status:'active', openedDate:'2026-01-10', pao:12, actives:['Niacinamide'], notes:'' },
  { id:'p7', name:'The Dewy Skin Cream', brand:'Tatcha', type:'Moisturiser',
    status:'unopened', openedDate:null, pao:12, actives:['Hyaluronic Acid','Ceramides'], notes:'' },
  { id:'p8', name:'Vitamin C Suspension 23%', brand:'The Ordinary', type:'Serum',
    status:'active', openedDate:'2026-03-01', pao:6, actives:['Vitamin C (L-AA)','Ferulic Acid'], notes:'AM only' },
];

const today = new Date().toISOString().split('T')[0];

const SAMPLE_ROUTINE = [
  { id:'r1', productId:'p1', period:'AM', frequency:'daily', startDate:'2025-12-01', order:0 },
  { id:'r2', productId:'p3', period:'AM', frequency:'daily', startDate:'2026-01-05', order:1 },
  { id:'r3', productId:'p8', period:'AM', frequency:'daily', startDate:'2026-03-01', order:2 },
  { id:'r4', productId:'p6', period:'AM', frequency:'daily', startDate:'2026-01-10', order:3 },
  { id:'r5', productId:'p1', period:'PM', frequency:'daily', startDate:'2025-12-01', order:0 },
  { id:'r6', productId:'p2', period:'PM', frequency:'alternate', startDate:'2026-01-01', order:1 },
  { id:'r7', productId:'p4', period:'PM', frequency:'2x-week', startDate:'2026-02-01', order:2 },
  { id:'r8', productId:'p5', period:'PM', frequency:'daily', startDate:'2025-11-20', order:3 },
];

const SAMPLE_REACTIONS = [
  { id:'rx1', date:'2026-02-08', description:'Slight peeling around the nose — likely from introducing retinol too fast.', suspectedProducts:['p4'] },
  { id:'rx2', date:'2026-03-15', description:'Tingling on cheeks after layering vitamin C and BHA in the same session. Redness resolved within an hour.', suspectedProducts:['p8','p2'] },
];

// ── Streak helpers ───────────────────────────────────────────────────────────
function computeStreak(logs) {
  // logs: array of { date, period, routineItemId, completed }
  const completedDates = new Set(
    logs.filter(l => l.completed).map(l => l.date)
  );
  let streak = 0;
  const d = new Date();
  d.setHours(0,0,0,0);
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (completedDates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else { break; }
  }
  return streak;
}

function longestStreak(logs) {
  const completedDates = [...new Set(logs.filter(l=>l.completed).map(l=>l.date))].sort();
  if (!completedDates.length) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i-1]);
    const curr = new Date(completedDates[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

// Get today's YYYY-MM-DD string in a given IANA timezone
function getTodayInTz(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  } catch(e) {
    return new Intl.DateTimeFormat('en-CA').format(new Date());
  }
}
window.getTodayInTz = getTodayInTz;
function loadStore() {
  try {
    const raw = localStorage.getItem('skincareApp');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // First run → seed sample data
  const store = {
    user: null,
    products: SAMPLE_PRODUCTS,
    routine: SAMPLE_ROUTINE,
    logs: [],
    reactions: SAMPLE_REACTIONS,
    darkMode: false,
    skinTypes: ['Normal','Dry','Oily','Combination','Sensitive'],
    userProfile: { name:'', skinType:'Normal', email:'', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  };
  saveStore(store);
  return store;
}

function saveStore(store) {
  localStorage.setItem('skincareApp', JSON.stringify(store));
}

// Expose globals
window.ACTIVES_LIST = ACTIVES_LIST;
window.PRODUCT_TYPES = PRODUCT_TYPES;
window.PAO_OPTIONS = PAO_OPTIONS;
window.FREQUENCY_OPTIONS = FREQUENCY_OPTIONS;
window.computeExpiry = computeExpiry;
window.computeBarrierLoad = computeBarrierLoad;
window.barrierLoadLabel = barrierLoadLabel;
window.computeStreak = computeStreak;
window.longestStreak = longestStreak;
window.loadStore = loadStore;
window.saveStore = saveStore;
