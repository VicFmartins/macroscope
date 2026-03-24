import type {
  AIInsight,
  ApiMeta,
  ApiResult,
  ComparisonResult,
  CountryData,
  CountryDetail,
  CountryMetadata,
  InvestorProfile,
  MetricSummary,
  RankingEntry,
  TriggerCollectionResponse,
  Trend,
} from '@/types'
import {
  COUNTRY_MAP,
  COUNTRIES,
  getMockComparison,
  getMockCountryDetail,
  getMockRanking,
  MOCK_INSIGHTS,
  MOCK_METRICS,
  MOCK_TREND_DATA,
} from './mock-data'

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

const REQUEST_TIMEOUT_MS = 6500
const MAX_RETRIES = 2

let metadataCache: Promise<ApiResult<CountryMetadata[]>> | null = null

interface BackendRankingItem {
  countryCode: string
  displayName: string
  score: number
  inflation?: number | null
  interestRate?: number | null
  exchangeRate?: number | null
  costOfLivingIndex?: number | null
  collectedAt: string
  investorProfile: string
}

interface BackendSnapshot {
  countryCode: string
  displayName: string
  collectedAt: string
  inflation: number | null
  interestRate: number | null
  exchangeRate: number | null
  costOfLivingIndex: number | null
  score: number
  investorProfile: string
}

interface BackendCountryMetadata {
  countryCode: string
  displayName: string
  iso2Code: string
  flag: string
  region: string
  currency: string
}

export interface DashboardData {
  ranking: RankingEntry[]
  mapCountries: CountryData[]
  metrics: MetricSummary
  insights: AIInsight[]
  trendData: typeof MOCK_TREND_DATA
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildLiveMeta(): ApiMeta {
  return { source: 'live', offline: false }
}

function buildMockMeta(warning = 'Backend unavailable. Using mock data.'): ApiMeta {
  return { source: 'mock', offline: true, warning }
}

function mergeMeta(...metas: ApiMeta[]): ApiMeta {
  const warnings = metas.map(meta => meta.warning).filter(Boolean)
  const hasLive = metas.some(meta => meta.source === 'live')
  const hasFallback = metas.some(meta => meta.source !== 'live')

  if (hasLive && hasFallback) {
    return {
      source: 'partial',
      offline: false,
      warning: warnings[0] ?? 'Some live services failed. Fallback data is active for part of the UI.',
    }
  }

  if (hasLive) {
    return warnings.length > 0
      ? { source: 'live', offline: false, warning: warnings[0] }
      : buildLiveMeta()
  }

  return warnings.length > 0 ? buildMockMeta(warnings[0]) : buildMockMeta()
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          ...(options?.headers ?? {}),
        },
        ...options,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (response.status === 204) {
        return null as T
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error
      if (attempt >= MAX_RETRIES) {
        break
      }
      await delay(250 * (attempt + 1))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}

function mockMetadataList(): CountryMetadata[] {
  return COUNTRIES.map(country => ({
    code: country.code,
    name: country.name,
    iso2: country.iso2.toUpperCase(),
    flag: flagEmoji(country.iso2),
    region: country.region,
    currency: currencyCodeFor(country.code),
  }))
}

function currencyCodeFor(code: string): string {
  const currencies: Record<string, string> = {
    USA: 'USD', DEU: 'EUR', JPN: 'JPY', GBR: 'GBP', FRA: 'EUR', ITA: 'EUR', CAN: 'CAD',
    CHN: 'CNY', IND: 'INR', BRA: 'BRL', RUS: 'RUB', ZAF: 'ZAR', KOR: 'KRW', AUS: 'AUD',
    MEX: 'MXN', IDN: 'IDR', TUR: 'TRY', SAU: 'SAR', ARG: 'ARS', ESP: 'EUR', NLD: 'EUR',
    CHE: 'CHF', SWE: 'SEK', NOR: 'NOK', SGP: 'SGD', ARE: 'AED', CHL: 'CLP', COL: 'COP',
    PER: 'PEN', POL: 'PLN',
  }
  return currencies[code] ?? 'USD'
}

function flagEmoji(iso2: string) {
  return iso2
    .toUpperCase()
    .split('')
    .map(letter => String.fromCodePoint(0x1f1e6 - 65 + letter.charCodeAt(0)))
    .join('')
}

function deriveTrend(code: string, score: number, inflation: number | null, interestRate: number | null): Trend {
  const fallbackTrend = COUNTRY_MAP[code]?.trend
  if (fallbackTrend) {
    return fallbackTrend
  }
  if (inflation !== null && inflation <= 3 && interestRate !== null && interestRate <= 5.5) {
    return 'up'
  }
  if ((inflation ?? 0) >= 8 || (interestRate ?? 0) >= 10) {
    return 'down'
  }
  return score >= 60 ? 'up' : score <= 35 ? 'down' : 'stable'
}

function toMetadataMap(metadata: CountryMetadata[]) {
  return Object.fromEntries(metadata.map(item => [item.code, item])) as Record<string, CountryMetadata>
}

function mapBackendMetadata(items: BackendCountryMetadata[]): CountryMetadata[] {
  return items.map(item => ({
    code: item.countryCode,
    name: item.displayName,
    iso2: item.iso2Code.toUpperCase(),
    flag: item.flag,
    region: item.region,
    currency: item.currency,
  }))
}

function rankingItemToCountryData(item: BackendRankingItem, metadata?: CountryMetadata): CountryData {
  const mockCountry = COUNTRY_MAP[item.countryCode]
  const inflation = item.inflation ?? mockCountry?.inflation ?? null
  const interestRate = item.interestRate ?? mockCountry?.interestRate ?? null
  const exchangeRate = item.exchangeRate ?? mockCountry?.exchangeRate ?? null
  const costOfLivingIndex = item.costOfLivingIndex ?? mockCountry?.costOfLivingIndex ?? null

  return {
    code: item.countryCode,
    name: item.displayName,
    iso2: metadata?.iso2.toLowerCase() ?? mockCountry?.iso2 ?? 'xx',
    region: metadata?.region ?? mockCountry?.region ?? 'Unknown',
    score: Number(item.score),
    trend: deriveTrend(item.countryCode, Number(item.score), inflation, interestRate),
    inflation: inflation !== null ? Number(inflation) : null,
    interestRate: interestRate !== null ? Number(interestRate) : null,
    exchangeRate: exchangeRate !== null ? Number(exchangeRate) : null,
    costOfLivingIndex: costOfLivingIndex !== null ? Number(costOfLivingIndex) : null,
    collectedAt: item.collectedAt,
  }
}

function snapshotToCountryData(snapshot: BackendSnapshot, metadata?: CountryMetadata): CountryData {
  const mockCountry = COUNTRY_MAP[snapshot.countryCode]
  return {
    code: snapshot.countryCode,
    name: snapshot.displayName,
    iso2: metadata?.iso2.toLowerCase() ?? mockCountry?.iso2 ?? 'xx',
    region: metadata?.region ?? mockCountry?.region ?? 'Unknown',
    score: Number(snapshot.score),
    trend: deriveTrend(snapshot.countryCode, Number(snapshot.score), snapshot.inflation, snapshot.interestRate),
    inflation: snapshot.inflation !== null ? Number(snapshot.inflation) : null,
    interestRate: snapshot.interestRate !== null ? Number(snapshot.interestRate) : null,
    exchangeRate: snapshot.exchangeRate !== null ? Number(snapshot.exchangeRate) : null,
    costOfLivingIndex: snapshot.costOfLivingIndex !== null ? Number(snapshot.costOfLivingIndex) : null,
    collectedAt: snapshot.collectedAt,
  }
}

function buildRankingEntries(countries: CountryData[]): RankingEntry[] {
  return countries.map((country, index) => ({
    rank: index + 1,
    code: country.code,
    name: country.name,
    iso2: country.iso2,
    region: country.region,
    score: country.score,
    trend: country.trend,
    inflation: country.inflation,
    interestRate: country.interestRate,
  }))
}

function deriveMetrics(countries: CountryData[]): MetricSummary {
  if (countries.length === 0) {
    return MOCK_METRICS
  }

  const withInflation = countries.filter(country => country.inflation !== null)
  const withInterest = countries.filter(country => country.interestRate !== null)
  const withCost = countries.filter(country => country.costOfLivingIndex !== null)

  const avgInflation = withInflation.length > 0
    ? withInflation.reduce((sum, country) => sum + (country.inflation ?? 0), 0) / withInflation.length
    : MOCK_METRICS.avgInflation

  const avgInterestRate = withInterest.length > 0
    ? withInterest.reduce((sum, country) => sum + (country.interestRate ?? 0), 0) / withInterest.length
    : MOCK_METRICS.avgInterestRate

  const avgCostOfLiving = withCost.length > 0
    ? withCost.reduce((sum, country) => sum + (country.costOfLivingIndex ?? 0), 0) / withCost.length
    : MOCK_METRICS.avgCostOfLiving

  const usdStrengthIndex = 100 + ((avgInterestRate - avgInflation) * 2)

  return {
    avgInflation,
    avgInterestRate,
    usdStrengthIndex,
    avgCostOfLiving,
    inflationTrend: avgInflation > MOCK_METRICS.avgInflation ? 'up' : avgInflation < MOCK_METRICS.avgInflation ? 'down' : 'stable',
    interestTrend: avgInterestRate > MOCK_METRICS.avgInterestRate ? 'up' : avgInterestRate < MOCK_METRICS.avgInterestRate ? 'down' : 'stable',
  }
}

export async function getCountryCatalog(forceRefresh = false): Promise<ApiResult<CountryMetadata[]>> {
  if (!forceRefresh && metadataCache) {
    return metadataCache
  }

  const loadPromise = (async () => {
    try {
      const response = await fetchJson<BackendCountryMetadata[]>('/metadata/countries')
      if (!Array.isArray(response) || response.length === 0) {
        return {
          data: mockMetadataList(),
          meta: buildMockMeta('Metadata endpoint returned no data. Using local fallback metadata.'),
        }
      }

      return {
        data: mapBackendMetadata(response),
        meta: buildLiveMeta(),
      }
    } catch {
      return {
        data: mockMetadataList(),
        meta: buildMockMeta('Metadata service is offline. Search and labels are using local fallback data.'),
      }
    }
  })()

  metadataCache = loadPromise
  const result = await loadPromise

  if (result.meta.source !== 'live') {
    metadataCache = null
  }

  return result
}

export async function getDashboardData(profile: InvestorProfile = 'MODERATE'): Promise<ApiResult<DashboardData>> {
  const metadataResult = await getCountryCatalog()
  const metadataMap = toMetadataMap(metadataResult.data)

  try {
    const rankingItems = await fetchJson<BackendRankingItem[]>('/ranking')
    if (!Array.isArray(rankingItems) || rankingItems.length === 0) {
      return {
        data: {
          ranking: getMockRanking(),
          mapCountries: COUNTRIES,
          metrics: MOCK_METRICS,
          insights: MOCK_INSIGHTS,
          trendData: MOCK_TREND_DATA,
        },
        meta: buildMockMeta('Ranking service returned no data. Showing mock dashboard data.'),
      }
    }

    const mapCountries = rankingItems.map(item => rankingItemToCountryData(item, metadataMap[item.countryCode]))
    return {
      data: {
        ranking: buildRankingEntries(mapCountries),
        mapCountries,
        metrics: deriveMetrics(mapCountries),
        insights: MOCK_INSIGHTS,
        trendData: MOCK_TREND_DATA,
      },
      meta: mergeMeta(buildLiveMeta(), metadataResult.meta),
    }
  } catch {
    return {
      data: {
        ranking: getMockRanking(),
        mapCountries: COUNTRIES,
        metrics: MOCK_METRICS,
        insights: MOCK_INSIGHTS,
        trendData: MOCK_TREND_DATA,
      },
      meta: buildMockMeta('Live ranking is unavailable. Dashboard switched to offline mode.'),
    }
  }
}

export async function getCountry(code: string): Promise<ApiResult<CountryDetail>> {
  const normalizedCode = code.toUpperCase()
  const metadataResult = await getCountryCatalog()
  const metadataMap = toMetadataMap(metadataResult.data)
  const mockFallback = getMockCountryDetail(normalizedCode)

  try {
    const snapshot = await fetchJson<BackendSnapshot>(`/country/${encodeURIComponent(normalizedCode)}`)
    return {
      data: {
        snapshot: snapshotToCountryData(snapshot, metadataMap[normalizedCode]),
        history: mockFallback.history,
      },
      meta: mergeMeta(buildLiveMeta(), metadataResult.meta),
    }
  } catch {
    return {
      data: mockFallback,
      meta: buildMockMeta(`Country data for ${normalizedCode} is unavailable. Showing fallback data.`),
    }
  }
}

export async function compareCountries(codes: string[]): Promise<ApiResult<ComparisonResult>> {
  if (codes.length === 0) {
    return { data: { countries: [] }, meta: buildLiveMeta() }
  }

  const results = await Promise.all(codes.map(code => getCountry(code)))
  const countries = results.map(result => result.data.snapshot)
  const meta = mergeMeta(...results.map(result => result.meta))

  if (countries.length === 0) {
    return {
      data: getMockComparison(codes),
      meta: buildMockMeta('Comparison data is unavailable. Showing fallback data.'),
    }
  }

  return {
    data: { countries },
    meta,
  }
}

export async function getInsights(): Promise<ApiResult<AIInsight[]>> {
  return {
    data: MOCK_INSIGHTS,
    meta: { source: 'mock', offline: false, warning: 'AI insights are still using curated fallback content.' },
  }
}

export async function triggerCollection(): Promise<ApiResult<TriggerCollectionResponse>> {
  try {
    const response = await fetchJson<TriggerCollectionResponse>('/collect/trigger', { method: 'POST' })
    return {
      data: response,
      meta: buildLiveMeta(),
    }
  } catch {
    return {
      data: { status: 'error_network' },
      meta: buildMockMeta('Collection trigger failed because the backend is offline.'),
    }
  }
}
