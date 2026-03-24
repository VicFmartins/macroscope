'use client'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, DollarSign, Landmark, RefreshCw, ShoppingCart } from 'lucide-react'
import type { MetricSummary } from '@/types'
import { fmtPct, cn } from '@/lib/utils'

const CARDS = (m: MetricSummary) => [
  {
    icon:     DollarSign,
    iconColor:'text-primary',
    iconBg:   'bg-primary/10',
    hoverBorder: 'hover:border-primary/40',
    label:    'Inflation (Avg)',
    value:    fmtPct(m.avgInflation),
    badge:    '+2.4%',
    badgeClass:'text-tertiary-dim',
    trend:    m.inflationTrend,
  },
  {
    icon:     Landmark,
    iconColor:'text-secondary',
    iconBg:   'bg-secondary/10',
    hoverBorder: 'hover:border-secondary/40',
    label:    'Interest Rate',
    value:    fmtPct(m.avgInterestRate),
    badge:    'STABLE',
    badgeClass:'text-outline',
    trend:    m.interestTrend,
  },
  {
    icon:     RefreshCw,
    iconColor:'text-tertiary-dim',
    iconBg:   'bg-tertiary/10',
    hoverBorder: 'hover:border-tertiary/40',
    label:    'USD Strength',
    value:    m.usdStrengthIndex.toFixed(1),
    badge:    'UPWARD',
    badgeClass:'text-tertiary-dim',
    trend:    'up' as const,
  },
  {
    icon:     ShoppingCart,
    iconColor:'text-error',
    iconBg:   'bg-error/10',
    hoverBorder: 'hover:border-error/40',
    label:    'Cost of Living',
    value:    m.avgCostOfLiving.toFixed(1),
    badge:    '-1.1%',
    badgeClass:'text-error',
    trend:    'down' as const,
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const card = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.35 } },
}

function MetricCards({ metrics }: { metrics: MetricSummary }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {CARDS(metrics).map((c) => (
        <motion.div
          key={c.label}
          variants={card}
          whileHover={{ scale: 1.025, transition: { duration: 0.2 } }}
          className={cn(
            'glass p-6 rounded-xl ghost-border transition-all duration-300 cursor-default group',
            c.hoverBorder
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <span className={cn('p-2 rounded-lg', c.iconBg)}>
              <c.icon className={cn('w-4 h-4', c.iconColor)} />
            </span>
            <span className={cn('text-[10px] font-bold', c.badgeClass)}>
              {c.badge}
            </span>
          </div>

          <p className="text-xs font-medium text-outline uppercase tracking-wider">
            {c.label}
          </p>
          <p className="text-3xl font-headline font-extrabold mt-1 tracking-tightest tabular-nums">
            {c.value}
          </p>

          {/* Trend indicator */}
          <div className="mt-3 flex items-center gap-1">
            {c.trend === 'up'     && <TrendingUp   className="w-3 h-3 text-tertiary-dim" />}
            {c.trend === 'down'   && <TrendingDown  className="w-3 h-3 text-error" />}
            {c.trend === 'stable' && <Minus         className="w-3 h-3 text-outline" />}
            <span className={cn(
              'text-[10px] font-semibold',
              c.trend === 'up'     ? 'text-tertiary-dim' :
              c.trend === 'down'   ? 'text-error' : 'text-outline'
            )}>
              {c.trend === 'up' ? 'Rising' : c.trend === 'down' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default memo(MetricCards)
