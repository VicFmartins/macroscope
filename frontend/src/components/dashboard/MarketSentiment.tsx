'use client'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, TrendingUp } from 'lucide-react'
import type { MetricSummary } from '@/types'

interface SentimentBar {
  label:   string
  value:   number
  color:   string
  icon:    React.ElementType
}

interface Props {
  metrics: MetricSummary
}

function AnimatedBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  return (
    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  )
}

function MarketSentiment({ metrics }: Props) {
  // Derive sentiment from metrics (0–100 scale)
  const stability   = Math.max(0, Math.min(100, 100 - metrics.avgInflation * 4))
  const growth      = Math.max(0, Math.min(100, metrics.usdStrengthIndex))
  const opportunity = Math.max(0, Math.min(100, 100 - metrics.avgInterestRate * 3))

  const bars: SentimentBar[] = [
    { label: 'Macro Stability',   value: stability,   color: '#3bbffa', icon: Shield   },
    { label: 'Growth Signal',     value: growth,      color: '#48e5d0', icon: TrendingUp },
    { label: 'Entry Opportunity', value: opportunity, color: '#8a95ff', icon: Zap      },
  ]

  const overallScore = Math.round((stability + growth + opportunity) / 3)
  const sentiment    = overallScore >= 65 ? 'Bullish' : overallScore >= 40 ? 'Neutral' : 'Cautious'
  const sentimentColor =
    overallScore >= 65 ? 'text-tertiary-dim' :
    overallScore >= 40 ? 'text-primary'      : 'text-error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
      className="bg-surface-container-low rounded-2xl ghost-border p-6"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-headline font-bold text-base tracking-tight">Market Sentiment</h2>
          <p className="text-[10px] text-outline mt-0.5 uppercase tracking-widest">global composite</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-extrabold font-headline tabular-nums ${sentimentColor}`}>
            {overallScore}
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${sentimentColor}`}>
            {sentiment}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {bars.map((bar, i) => {
          const Icon = bar.icon
          return (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-3 h-3" style={{ color: bar.color }} />
                  <span className="text-xs text-on-surface-variant">{bar.label}</span>
                </div>
                <motion.span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: bar.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  {bar.value.toFixed(0)}
                </motion.span>
              </div>
              <AnimatedBar value={bar.value} color={bar.color} delay={0.3 + i * 0.1} />
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default memo(MarketSentiment)
