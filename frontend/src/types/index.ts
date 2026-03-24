export type InvestorProfile = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'
export type Trend = 'up' | 'down' | 'stable'
export type DataSourceMode = 'live' | 'mock' | 'partial'

export interface CountryData {
  code: string          // ISO 3166-1 alpha-3
  name: string
  iso2: string          // ISO 3166-1 alpha-2 (for flag images)
  region: string
  score: number         // 0–100
  trend: Trend
  inflation: number | null          // % annual
  interestRate: number | null       // %
  exchangeRate: number | null       // local currency per 1 USD
  costOfLivingIndex: number | null  // GDP per capita PPP proxy (USD)
  collectedAt?: string
}

export interface RankingEntry {
  rank: number
  code: string
  name: string
  iso2: string
  region: string
  score: number
  trend: Trend
  inflation: number | null
  interestRate: number | null
}

export interface CountryMetadata {
  code: string
  name: string
  iso2: string
  flag: string
  region: string
  currency: string
}

export interface CountryDetail {
  snapshot: CountryData
  history: HistoryPoint[]
}

export interface HistoryPoint {
  date: string
  score: number
  inflation: number | null
  interestRate: number | null
  exchangeRate: number | null
}

export interface ComparisonResult {
  countries: CountryData[]
}

export interface AIInsight {
  id: string
  type: 'fiscal' | 'currency' | 'growth' | 'risk'
  title: string
  body: string
  country?: string
  timestamp: string
}

export interface MetricSummary {
  avgInflation: number
  avgInterestRate: number
  usdStrengthIndex: number
  avgCostOfLiving: number
  inflationTrend: Trend
  interestTrend: Trend
}

export interface ApiMeta {
  source: DataSourceMode
  offline: boolean
  warning?: string
}

export interface ApiResult<T> {
  data: T
  meta: ApiMeta
}

export interface TriggerCollectionResponse {
  status: string
  requestedCountries?: number
  savedSnapshots?: number
  skippedSnapshots?: number
  elapsedMs?: number
  timestamp?: string
}
