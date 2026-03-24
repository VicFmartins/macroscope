'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import TopNav  from '@/components/layout/TopNav'
import Sidebar from '@/components/layout/Sidebar'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { CountryDetail, DataSourceMode } from '@/types'
import { getCountry } from '@/lib/api'
import { scoreHex, scoreGlow, fmtPct, cn } from '@/lib/utils'

function flagEmoji(iso2: string) {
  return iso2.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))
  ).join('')
}

const SERIES = [
  { key: 'score',        label: 'Score',        color: '#3bbffa' },
  { key: 'inflation',    label: 'Inflation',    color: '#ff716c' },
  { key: 'interestRate', label: 'Interest Rate', color: '#8a95ff' },
]

export default function CountryPage() {
  const params = useParams<{ code: string }>()
  const code = params.code
  const [detail, setDetail] = useState<CountryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<DataSourceMode>('live')
  const [statusMessage, setStatusMessage] = useState<string | undefined>()

  useEffect(() => {
    if (!code) {
      return
    }

    setLoading(true)
    getCountry(code)
      .then(result => {
        setDetail(result.data)
        setConnectionStatus(result.meta.source)
        setStatusMessage(result.meta.warning)
      })
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <TopNav connectionStatus={connectionStatus} statusMessage={statusMessage} />
        <Sidebar />
        <main className="pt-20 lg:pl-64">
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            <div className="h-8 w-32 shimmer rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
            <div className="h-64 shimmer rounded-2xl" />
          </div>
        </main>
      </div>
    )
  }

  if (!detail) return null
  const { snapshot: c, history } = detail

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav connectionStatus={connectionStatus} statusMessage={statusMessage} />
      <Sidebar />

      <main className="pt-20 lg:pl-64">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Back */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x:  0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-outline hover:text-on-surface
                         transition-colors duration-200 w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Rankings
            </Link>
          </motion.div>

          {/* Country header */}
          <motion.div
            className="bg-surface-container-low rounded-2xl ghost-border p-6 md:p-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y:  0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-7xl">{flagEmoji(c.iso2)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-headline text-3xl font-black tracking-tightest">{c.name}</h1>
                  <span className="text-xs text-outline uppercase tracking-widest bg-surface-container px-2 py-1 rounded">
                    {c.region}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">{c.code}</p>
              </div>

              {/* Score badge */}
              <div
                className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl"
                style={{
                  background: `${scoreHex(c.score)}15`,
                  boxShadow: scoreGlow(c.score),
                  border: `1px solid ${scoreHex(c.score)}30`,
                }}
              >
                <p
                  className="text-4xl font-extrabold font-headline tabular-nums"
                  style={{ color: scoreHex(c.score) }}
                >
                  {c.score.toFixed(1)}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-outline mt-1">Score</p>
              </div>
            </div>
          </motion.div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Inflation',     value: fmtPct(c.inflation ?? 0),              trend: c.trend        },
              { label: 'Interest Rate', value: fmtPct(c.interestRate ?? 0),           trend: 'stable' as const },
              { label: 'Exchange Rate', value: (c.exchangeRate ?? 0).toFixed(4),      trend: 'up' as const  },
              { label: 'GDP PPP pc',    value: `$${((c.costOfLivingIndex ?? 0) / 1000).toFixed(1)}k`, trend: 'up' as const },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y:  0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
                className="bg-surface-container-low rounded-xl ghost-border p-4"
              >
                <p className="text-[10px] text-outline uppercase tracking-widest mb-2">{item.label}</p>
                <p className="text-2xl font-extrabold font-headline tabular-nums">{item.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {item.trend === 'up'     && <TrendingUp   className="w-3 h-3 text-tertiary-dim" />}
                  {item.trend === 'down'   && <TrendingDown  className="w-3 h-3 text-error" />}
                  {item.trend === 'stable' && <Minus         className="w-3 h-3 text-outline" />}
                  <span className={cn(
                    'text-[10px] font-semibold',
                    item.trend === 'up'     ? 'text-tertiary-dim' :
                    item.trend === 'down'   ? 'text-error' : 'text-outline'
                  )}>
                    {item.trend === 'up' ? 'Rising' : item.trend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* History chart */}
          <motion.div
            className="bg-surface-container-low rounded-2xl ghost-border p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y:  0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <h2 className="font-headline font-bold text-base tracking-tight mb-6">
              12-Month History
            </h2>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    {SERIES.map(s => (
                      <linearGradient key={s.key} id={`h-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={s.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="rgba(113,117,131,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#717583', fontSize: 9, fontFamily: 'Inter' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short' })}
                  />
                  <YAxis
                    tick={{ fill: '#717583', fontSize: 9, fontFamily: 'Inter' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ReTooltip
                    contentStyle={{
                      background: 'rgba(20,25,39,0.95)',
                      border: '1px solid rgba(113,117,131,0.2)',
                      borderRadius: 10,
                      fontSize: 11,
                      fontFamily: 'Inter',
                    }}
                  />
                  {SERIES.map(s => (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={`url(#h-grad-${s.key})`}
                      dot={false}
                      activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                      isAnimationActive
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
