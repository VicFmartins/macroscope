import type { CountryData, RankingEntry, CountryDetail, ComparisonResult, AIInsight, MetricSummary, HistoryPoint } from '@/types'

// ============================================================
// Raw country data — ordered by score descending
// ============================================================
export const COUNTRIES: CountryData[] = [
  { code: 'CHE', name: 'Switzerland',    iso2: 'ch', region: 'Europe',       score: 94.2, trend: 'up',     inflation: 1.8,   interestRate: 1.75,  exchangeRate: 0.89,   costOfLivingIndex: 91000 },
  { code: 'SGP', name: 'Singapore',      iso2: 'sg', region: 'Asia',         score: 92.1, trend: 'up',     inflation: 3.2,   interestRate: 3.86,  exchangeRate: 1.34,   costOfLivingIndex: 133000 },
  { code: 'NOR', name: 'Norway',         iso2: 'no', region: 'Europe',       score: 89.7, trend: 'up',     inflation: 3.8,   interestRate: 4.5,   exchangeRate: 10.6,   costOfLivingIndex: 95000 },
  { code: 'USA', name: 'United States',  iso2: 'us', region: 'N. America',   score: 86.3, trend: 'down',   inflation: 3.4,   interestRate: 5.25,  exchangeRate: 1.0,    costOfLivingIndex: 80000 },
  { code: 'DEU', name: 'Germany',        iso2: 'de', region: 'Europe',       score: 84.1, trend: 'up',     inflation: 2.9,   interestRate: 4.5,   exchangeRate: 0.92,   costOfLivingIndex: 63000 },
  { code: 'CAN', name: 'Canada',         iso2: 'ca', region: 'N. America',   score: 83.5, trend: 'stable', inflation: 2.8,   interestRate: 5.0,   exchangeRate: 1.36,   costOfLivingIndex: 57000 },
  { code: 'AUS', name: 'Australia',      iso2: 'au', region: 'Oceania',      score: 82.4, trend: 'up',     inflation: 3.5,   interestRate: 4.35,  exchangeRate: 1.52,   costOfLivingIndex: 62000 },
  { code: 'NLD', name: 'Netherlands',    iso2: 'nl', region: 'Europe',       score: 81.2, trend: 'stable', inflation: 2.6,   interestRate: 4.5,   exchangeRate: 0.92,   costOfLivingIndex: 65000 },
  { code: 'SWE', name: 'Sweden',         iso2: 'se', region: 'Europe',       score: 80.1, trend: 'down',   inflation: 3.1,   interestRate: 4.0,   exchangeRate: 10.4,   costOfLivingIndex: 60000 },
  { code: 'GBR', name: 'United Kingdom', iso2: 'gb', region: 'Europe',       score: 78.6, trend: 'stable', inflation: 4.0,   interestRate: 5.25,  exchangeRate: 0.79,   costOfLivingIndex: 56000 },
  { code: 'JPN', name: 'Japan',          iso2: 'jp', region: 'Asia',         score: 76.3, trend: 'down',   inflation: 2.7,   interestRate: 0.1,   exchangeRate: 149.5,  costOfLivingIndex: 48000 },
  { code: 'FRA', name: 'France',         iso2: 'fr', region: 'Europe',       score: 75.2, trend: 'stable', inflation: 2.8,   interestRate: 4.5,   exchangeRate: 0.92,   costOfLivingIndex: 56000 },
  { code: 'KOR', name: 'South Korea',    iso2: 'kr', region: 'Asia',         score: 74.1, trend: 'up',     inflation: 2.9,   interestRate: 3.5,   exchangeRate: 1340.0, costOfLivingIndex: 47000 },
  { code: 'ESP', name: 'Spain',          iso2: 'es', region: 'Europe',       score: 72.3, trend: 'up',     inflation: 3.2,   interestRate: 4.5,   exchangeRate: 0.92,   costOfLivingIndex: 46000 },
  { code: 'POL', name: 'Poland',         iso2: 'pl', region: 'Europe',       score: 70.1, trend: 'up',     inflation: 4.2,   interestRate: 5.75,  exchangeRate: 3.98,   costOfLivingIndex: 38000 },
  { code: 'ARE', name: 'UAE',            iso2: 'ae', region: 'Middle East',  score: 68.4, trend: 'up',     inflation: 3.5,   interestRate: 5.4,   exchangeRate: 3.67,   costOfLivingIndex: 78000 },
  { code: 'CHN', name: 'China',          iso2: 'cn', region: 'Asia',         score: 65.2, trend: 'down',   inflation: 0.2,   interestRate: 3.45,  exchangeRate: 7.24,   costOfLivingIndex: 23000 },
  { code: 'ITA', name: 'Italy',          iso2: 'it', region: 'Europe',       score: 63.8, trend: 'stable', inflation: 5.3,   interestRate: 4.5,   exchangeRate: 0.92,   costOfLivingIndex: 45000 },
  { code: 'SAU', name: 'Saudi Arabia',   iso2: 'sa', region: 'Middle East',  score: 61.2, trend: 'stable', inflation: 2.1,   interestRate: 6.0,   exchangeRate: 3.75,   costOfLivingIndex: 54000 },
  { code: 'CHL', name: 'Chile',          iso2: 'cl', region: 'S. America',   score: 58.3, trend: 'up',     inflation: 7.6,   interestRate: 8.25,  exchangeRate: 885.0,  costOfLivingIndex: 26000 },
  { code: 'IND', name: 'India',          iso2: 'in', region: 'Asia',         score: 55.4, trend: 'up',     inflation: 5.4,   interestRate: 6.5,   exchangeRate: 83.2,   costOfLivingIndex: 9000 },
  { code: 'MEX', name: 'Mexico',         iso2: 'mx', region: 'N. America',   score: 52.1, trend: 'down',   inflation: 4.9,   interestRate: 11.25, exchangeRate: 17.2,   costOfLivingIndex: 22000 },
  { code: 'PER', name: 'Peru',           iso2: 'pe', region: 'S. America',   score: 50.3, trend: 'stable', inflation: 3.7,   interestRate: 6.75,  exchangeRate: 3.78,   costOfLivingIndex: 15000 },
  { code: 'COL', name: 'Colombia',       iso2: 'co', region: 'S. America',   score: 48.2, trend: 'up',     inflation: 9.3,   interestRate: 12.0,  exchangeRate: 3900.0, costOfLivingIndex: 18000 },
  { code: 'BRA', name: 'Brazil',         iso2: 'br', region: 'S. America',   score: 45.3, trend: 'down',   inflation: 4.6,   interestRate: 10.5,  exchangeRate: 5.12,   costOfLivingIndex: 18000 },
  { code: 'ZAF', name: 'South Africa',   iso2: 'za', region: 'Africa',       score: 42.1, trend: 'down',   inflation: 5.3,   interestRate: 8.25,  exchangeRate: 18.7,   costOfLivingIndex: 15000 },
  { code: 'IDN', name: 'Indonesia',      iso2: 'id', region: 'Asia',         score: 40.4, trend: 'stable', inflation: 2.7,   interestRate: 6.0,   exchangeRate: 15700.0,costOfLivingIndex: 14000 },
  { code: 'RUS', name: 'Russia',         iso2: 'ru', region: 'Europe',       score: 35.2, trend: 'down',   inflation: 6.7,   interestRate: 16.0,  exchangeRate: 92.5,   costOfLivingIndex: 29000 },
  { code: 'TUR', name: 'Turkey',         iso2: 'tr', region: 'Europe',       score: 28.3, trend: 'down',   inflation: 64.9,  interestRate: 40.0,  exchangeRate: 32.2,   costOfLivingIndex: 36000 },
  { code: 'ARG', name: 'Argentina',      iso2: 'ar', region: 'S. America',   score: 14.1, trend: 'down',   inflation: 211.4, interestRate: 100.0, exchangeRate: 870.0,  costOfLivingIndex: 23000 },
]

// Map iso3 → numeric ISO for world-atlas topojson
export const ISO3_TO_NUMERIC: Record<string, string> = {
  CHE: '756', SGP: '702', NOR: '578', USA: '840', DEU: '276',
  CAN: '124', AUS: '036', NLD: '528', SWE: '752', GBR: '826',
  JPN: '392', FRA: '250', KOR: '410', ESP: '724', POL: '616',
  ARE: '784', CHN: '156', ITA: '380', SAU: '682', CHL: '152',
  IND: '356', MEX: '484', PER: '604', COL: '170', BRA: '076',
  ZAF: '710', IDN: '360', RUS: '643', TUR: '792', ARG: '032',
}

// Lookup by iso3 code
export const COUNTRY_MAP: Record<string, CountryData> = Object.fromEntries(
  COUNTRIES.map(c => [c.code, c])
)

// ============================================================
// Mock ranking
// ============================================================
export function getMockRanking(): RankingEntry[] {
  return COUNTRIES.map((c, i) => ({
    rank: i + 1,
    code: c.code,
    name: c.name,
    iso2: c.iso2,
    region: c.region,
    score: c.score,
    trend: c.trend,
    inflation: c.inflation,
    interestRate: c.interestRate,
  }))
}

// ============================================================
// Mock country detail with synthetic history
// ============================================================
export function getMockCountryDetail(code: string): CountryDetail {
  const snapshot = COUNTRY_MAP[code] ?? COUNTRIES[0]

  const history: HistoryPoint[] = Array.from({ length: 12 }, (_, i) => {
    const monthsAgo = 11 - i
    const variance = (Math.random() - 0.5) * 6
    return {
      date: new Date(Date.now() - monthsAgo * 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 7),
      score:        Math.max(0, Math.min(100, snapshot.score + variance)),
      inflation:    snapshot.inflation !== null ? +(snapshot.inflation + (Math.random() - 0.5) * 1).toFixed(2) : null,
      interestRate: snapshot.interestRate !== null ? +(snapshot.interestRate + (Math.random() - 0.5) * 0.5).toFixed(2) : null,
      exchangeRate: snapshot.exchangeRate !== null ? +(snapshot.exchangeRate * (1 + (Math.random() - 0.5) * 0.05)).toFixed(4) : null,
    }
  })

  return { snapshot, history }
}

// ============================================================
// Mock comparison
// ============================================================
export function getMockComparison(codes: string[]): ComparisonResult {
  return {
    countries: codes.map(c => COUNTRY_MAP[c] ?? COUNTRIES[0]),
  }
}

// ============================================================
// Mock AI insights
// ============================================================
export const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'fiscal',
    title: 'Fiscal Update',
    body: 'Germany shows stable inflation curves despite energy pivots. Institutional confidence is rising as ECB maintains hawkish posture.',
    country: 'DEU',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'currency',
    title: 'Currency Risk',
    body: 'Emerging markets in SE Asia face 4.2% liquidation pressure due to USD strengthening. Indonesia and Philippines most exposed.',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'growth',
    title: 'Growth Signal',
    body: 'Swiss consumer spending has outperformed quarterly projections by 0.8%. SNB expected to maintain low rates through Q2.',
    country: 'CHE',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'risk',
    title: 'Macro Alert',
    body: 'Argentina enters hyperinflationary spiral at 211% YoY. Capital controls tightened; peso peg under severe stress.',
    country: 'ARG',
    timestamp: new Date().toISOString(),
  },
]

// ============================================================
// Mock global metrics summary
// ============================================================
export const MOCK_METRICS: MetricSummary = {
  avgInflation:     3.12,
  avgInterestRate:  5.25,
  usdStrengthIndex: 104.2,
  avgCostOfLiving:  84.5,
  inflationTrend:   'up',
  interestTrend:    'stable',
}

// ============================================================
// Mock chart data: Inflation vs Interest Rate (12 months, G7 avg)
// ============================================================
export const MOCK_TREND_DATA = [
  { month: 'Jan', inflation: 4.2, interestRate: 4.8 },
  { month: 'Feb', inflation: 4.0, interestRate: 4.9 },
  { month: 'Mar', inflation: 3.8, interestRate: 5.0 },
  { month: 'Apr', inflation: 3.6, interestRate: 5.1 },
  { month: 'May', inflation: 3.5, interestRate: 5.2 },
  { month: 'Jun', inflation: 3.4, interestRate: 5.25 },
  { month: 'Jul', inflation: 3.6, interestRate: 5.25 },
  { month: 'Aug', inflation: 3.3, interestRate: 5.25 },
  { month: 'Sep', inflation: 3.2, interestRate: 5.1 },
  { month: 'Oct', inflation: 3.1, interestRate: 5.0 },
  { month: 'Nov', inflation: 3.0, interestRate: 4.9 },
  { month: 'Dec', inflation: 3.12, interestRate: 4.8 },
]
