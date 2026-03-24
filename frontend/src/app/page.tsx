'use client'

import dynamic from 'next/dynamic'
import { startTransition, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'
import AIInsights from '@/components/dashboard/AIInsights'
import GlobalRankings from '@/components/dashboard/GlobalRankings'
import MarketSentiment from '@/components/dashboard/MarketSentiment'
import MetricCards from '@/components/dashboard/MetricCards'
import type { CountryData, DataSourceMode, InvestorProfile, MetricSummary, RankingEntry } from '@/types'
import { getDashboardData, triggerCollection } from '@/lib/api'
import { MOCK_INSIGHTS, MOCK_METRICS, MOCK_TREND_DATA } from '@/lib/mock-data'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

const REFRESH_INTERVAL_MS = 45_000

const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
      <div className="h-5 w-32 shimmer rounded mb-4" />
      <div className="h-64 shimmer rounded-xl" />
    </div>
  ),
})

const TrendChart = dynamic(() => import('@/components/dashboard/TrendChart'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
      <div className="h-4 w-40 shimmer rounded mb-6" />
      <div className="h-52 shimmer rounded-xl" />
    </div>
  ),
})

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.55 } },
}

function rankingsAreEqual(left: RankingEntry[], right: RankingEntry[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((entry, index) => {
    const other = right[index]
    return (
      entry.code === other.code &&
      entry.rank === other.rank &&
      entry.score === other.score &&
      entry.inflation === other.inflation &&
      entry.interestRate === other.interestRate
    )
  })
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<InvestorProfile>('MODERATE')
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [mapCountries, setMapCountries] = useState<CountryData[]>([])
  const [metrics, setMetrics] = useState<MetricSummary>(MOCK_METRICS)
  const [insights, setInsights] = useState(MOCK_INSIGHTS)
  const [trendData, setTrendData] = useState(MOCK_TREND_DATA)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshPending, setRefreshPending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<DataSourceMode>('live')
  const [statusMessage, setStatusMessage] = useState<string | undefined>()
  const [notice, setNotice] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const result = await getDashboardData(profile)
      const apply = () => {
        setRanking(current => rankingsAreEqual(current, result.data.ranking) ? current : result.data.ranking)
        setMapCountries(result.data.mapCountries)
        setMetrics(result.data.metrics)
        setInsights(result.data.insights)
        setTrendData(result.data.trendData)
        setConnectionStatus(result.meta.source)
        setStatusMessage(result.meta.warning)
        setLastUpdated(new Date())
      }

      if (isBackground) {
        startTransition(apply)
      } else {
        apply()
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile])

  useEffect(() => {
    void fetchData(false)
  }, [fetchData])

  useAutoRefresh(() => {
    void fetchData(true)
  }, REFRESH_INTERVAL_MS, true)

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const handleRefreshData = useCallback(async () => {
    setRefreshPending(true)
    try {
      const result = await triggerCollection()
      if (result.meta.source === 'live' && result.data.status === 'ok') {
        setNotice(`Collection completed: ${result.data.savedSnapshots ?? 0} snapshots refreshed.`)
      } else {
        setNotice(result.meta.warning ?? 'Collection request failed. Offline fallback remains active.')
      }
      await fetchData(true)
    } finally {
      setRefreshPending(false)
    }
  }, [fetchData])

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav
        connectionStatus={connectionStatus}
        statusMessage={statusMessage}
        onRefreshData={handleRefreshData}
        refreshPending={refreshPending}
      />
      <Sidebar />

      <main className="pt-20 lg:pl-64">
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="font-headline text-4xl font-black tracking-tightest">
                  Global <span className="gradient-text">Intelligence</span>
                </h1>
                <p className="text-on-surface-variant mt-1 text-sm">
                  Real-time macroeconomic analysis across 30 countries
                </p>
              </div>
              <div className="text-right">
                {lastUpdated && (
                  <p className="text-[10px] text-outline hidden md:block">
                    <span className="pulse-dot mr-1" />
                    Updated {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
                {refreshing && (
                  <p className="text-[10px] text-primary uppercase tracking-[0.2em] mt-1">
                    Syncing live feed
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {notice && (
              <motion.div
                key={notice}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"
              >
                {notice}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
            <MetricCards metrics={metrics} />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
            <WorldMap countries={mapCountries} loading={loading} />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
          >
            <div className="min-h-[600px]">
              <GlobalRankings
                entries={ranking}
                profile={profile}
                onProfile={setProfile}
                loading={loading}
                refreshing={refreshing}
              />
            </div>
            <AIInsights insights={insights} loading={loading} />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
          >
            <TrendChart data={trendData} loading={loading} />
            <MarketSentiment metrics={metrics} />
          </motion.div>
        </div>
      </main>
    </div>
  )
}
