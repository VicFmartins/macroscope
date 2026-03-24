'use client'
import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

interface TrendPoint {
  month:        string
  inflation:    number
  interestRate: number
}

interface Props {
  data:     TrendPoint[]
  loading?: boolean
}

const SERIES = [
  { key: 'inflation',    label: 'Inflation',     color: '#3bbffa', glow: 'rgba(59,191,250,0.25)' },
  { key: 'interestRate', label: 'Interest Rate',  color: '#8a95ff', glow: 'rgba(138,149,255,0.25)' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2.5 shadow-ambient text-xs">
      <p className="text-outline mb-1.5 uppercase tracking-wider text-[9px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-on-surface-variant">{p.name}:</span>
          <span className="font-bold tabular-nums">{p.value.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  )
}

function TrendChart({ data, loading }: Props) {
  const [active, setActive] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
        <div className="h-4 w-40 shimmer rounded mb-6" />
        <div className="h-52 shimmer rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
      className="bg-surface-container-low rounded-2xl ghost-border p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-base tracking-tight">G7 Macro Trend</h2>
          <p className="text-[10px] text-outline mt-0.5 uppercase tracking-widest">12-month avg</p>
        </div>
        <div className="flex items-center gap-3">
          {SERIES.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(prev => prev === s.key ? null : s.key)}
              className={cn(
                'flex items-center gap-1.5 text-[10px] font-semibold transition-opacity duration-200',
                active && active !== s.key ? 'opacity-30' : 'opacity-100'
              )}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.0}  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke="rgba(113,117,131,0.08)" vertical={false} />

            <XAxis
              dataKey="month"
              tick={{ fill: '#717583', fontSize: 9, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#717583', fontSize: 9, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
            />

            <ReTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(113,117,131,0.2)', strokeWidth: 1 }} />

            {SERIES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={active && active !== s.key ? 0.5 : 2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
                opacity={active && active !== s.key ? 0.2 : 1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default memo(TrendChart)
