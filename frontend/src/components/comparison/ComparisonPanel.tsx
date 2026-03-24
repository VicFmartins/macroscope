'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loader2, Plus, X } from 'lucide-react'
import type { CountryData, CountryMetadata, DataSourceMode } from '@/types'
import { compareCountries, getCountryCatalog } from '@/lib/api'
import { COUNTRIES } from '@/lib/mock-data'
import { cn, fmtPct, scoreHex } from '@/lib/utils'

const PALETTE = ['#3bbffa', '#8a95ff', '#48e5d0', '#ff716c']

const DEFAULT_CATALOG: CountryMetadata[] = COUNTRIES.map(country => ({
  code: country.code,
  name: country.name,
  iso2: country.iso2.toUpperCase(),
  flag: flagEmoji(country.iso2),
  region: country.region,
  currency: 'USD',
}))

interface Props {
  initial?: string[]
}

function ComparisonPanel({ initial = ['USA', 'DEU', 'BRA'] }: Props) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [data, setData] = useState<CountryData[]>([])
  const [catalog, setCatalog] = useState<CountryMetadata[]>(DEFAULT_CATALOG)
  const [loadingData, setLoadingData] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<DataSourceMode>('live')
  const [statusMessage, setStatusMessage] = useState<string | undefined>()

  useEffect(() => {
    let active = true

    getCountryCatalog()
      .then(result => {
        if (active) {
          setCatalog(result.data)
        }
      })
      .catch(() => {
        if (active) {
          setCatalog(DEFAULT_CATALOG)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selected.length === 0) {
      setData([])
      return
    }

    setLoadingData(true)
    compareCountries(selected)
      .then(result => {
        setData(result.data.countries)
        setConnectionStatus(result.meta.source)
        setStatusMessage(result.meta.warning)
      })
      .finally(() => setLoadingData(false))
  }, [selected])

  const removeCountry = (code: string) => {
    setSelected(current => current.filter(item => item !== code))
  }

  const addCountry = (code: string) => {
    if (selected.includes(code) || selected.length >= 4) {
      return
    }

    setSelected(current => [...current, code])
    setSearch('')
    setShowSearch(false)
  }

  const suggestions = catalog
    .filter(country => !selected.includes(country.code) && (
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.code.toLowerCase().includes(search.toLowerCase())
    ))
    .slice(0, 6)

  const radarData = [
    { metric: 'Score', ...Object.fromEntries(data.map(country => [country.code, country.score])) },
    { metric: 'Inflation-1', ...Object.fromEntries(data.map(country => [country.code, Math.max(0, 100 - (country.inflation ?? 0) * 5)])) },
    { metric: 'Rate-1', ...Object.fromEntries(data.map(country => [country.code, Math.max(0, 100 - (country.interestRate ?? 0) * 5)])) },
    { metric: 'FX Stable', ...Object.fromEntries(data.map(country => [country.code, Math.max(0, 100 - (country.exchangeRate ?? 0) * 3)])) },
    { metric: 'Cost of Living', ...Object.fromEntries(data.map(country => [country.code, Math.min(100, (country.costOfLivingIndex ?? 0) / 800)])) },
  ]

  const barData = [
    { name: 'Score', ...Object.fromEntries(data.map(country => [country.code, country.score])) },
    { name: 'Inflation', ...Object.fromEntries(data.map(country => [country.code, country.inflation])) },
    { name: 'Rate', ...Object.fromEntries(data.map(country => [country.code, country.interestRate])) },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="font-headline font-bold text-base tracking-tight">Comparing Countries</h2>
            {statusMessage && (
              <p className={cn(
                'text-[10px] uppercase tracking-[0.16em] mt-1',
                connectionStatus === 'mock' ? 'text-error' : 'text-primary'
              )}>
                {statusMessage}
              </p>
            )}
          </div>
          {selected.length < 4 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(value => !value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10
                         text-primary text-xs font-semibold ghost-border transition-colors duration-200
                         hover:bg-primary/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Country
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-surface-container-high rounded-xl p-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm
                             placeholder:text-outline outline-none focus:ring-1 focus:ring-primary/50"
                />
                {suggestions.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {suggestions.map(country => (
                      <button
                        key={country.code}
                        onClick={() => addCountry(country.code)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                   hover:bg-surface-bright text-left transition-colors duration-150"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <div>
                          <span className="text-sm font-medium">{country.name}</span>
                          <p className="text-[10px] text-outline uppercase tracking-wider">{country.region}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-bold text-outline uppercase tracking-[0.16em]">
                          {country.currency}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 items-center">
          {loadingData && (
            <Loader2 className="w-3.5 h-3.5 text-outline animate-spin" />
          )}
          <AnimatePresence>
            {data.map((country, index) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full ghost-border bg-surface-container-high"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[index] }}
                />
                <span className="text-sm">{flagEmoji(country.iso2)}</span>
                <span className="text-xs font-semibold">{country.name}</span>
                <button
                  onClick={() => removeCountry(country.code)}
                  className="ml-1 text-outline hover:text-error transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingData && selected.map(code => (
          <div key={code} className="h-44 shimmer rounded-xl" />
        ))}
        <AnimatePresence mode="popLayout">
          {!loadingData && data.map((country, index) => (
            <motion.div
              key={country.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-surface-container-low rounded-xl ghost-border p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[index] }} />
                <span className="text-sm">{flagEmoji(country.iso2)}</span>
                <span className="text-xs font-semibold truncate">{country.name}</span>
              </div>
              <p
                className="text-3xl font-extrabold font-headline tabular-nums"
                style={{ color: scoreHex(country.score) }}
              >
                {country.score.toFixed(1)}
              </p>
              <p className="text-[9px] text-outline uppercase tracking-widest mt-1">Score</p>
              <div className="mt-3 space-y-1">
                {[
                  { label: 'Inflation', value: fmtPct(country.inflation) },
                  { label: 'Rate', value: fmtPct(country.interestRate) },
                  { label: 'FX', value: country.exchangeRate?.toFixed(2) ?? '--' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-[10px] text-outline">{row.label}</span>
                    <span className="text-[10px] font-semibold tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
          <h3 className="font-headline font-bold text-sm tracking-tight mb-4">Multi-Axis Profile</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(113,117,131,0.15)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#717583', fontSize: 10, fontFamily: 'Inter' }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {data.map((country, index) => (
                  <Radar
                    key={country.code}
                    name={country.name}
                    dataKey={country.code}
                    stroke={PALETTE[index]}
                    fill={PALETTE[index]}
                    fillOpacity={0.12}
                    strokeWidth={1.5}
                    isAnimationActive
                    animationDuration={800}
                  />
                ))}
                <ReTooltip
                  contentStyle={{
                    background: 'rgba(20,25,39,0.95)',
                    border: '1px solid rgba(113,117,131,0.2)',
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: 'Inter',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
          <h3 className="font-headline font-bold text-sm tracking-tight mb-4">Side-by-Side Metrics</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(113,117,131,0.08)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#717583', fontSize: 10, fontFamily: 'Inter' }}
                  tickLine={false}
                  axisLine={false}
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
                {data.map((country, index) => (
                  <Bar
                    key={country.code}
                    dataKey={country.code}
                    name={country.name}
                    fill={PALETTE[index]}
                    radius={[2, 2, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationBegin={index * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function flagEmoji(iso2: string) {
  return iso2.toUpperCase().split('').map(character =>
    String.fromCodePoint(0x1f1e6 - 65 + character.charCodeAt(0))
  ).join('')
}

export default ComparisonPanel
