'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { InvestorProfile, RankingEntry } from '@/types'
import { cn, fmtPct, scoreColor, scoreHex } from '@/lib/utils'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
}

const row = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { ease: 'easeOut', duration: 0.35 } },
}

const PROFILES: { label: string; value: InvestorProfile }[] = [
  { label: 'Conservative', value: 'CONSERVATIVE' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'Aggressive', value: 'AGGRESSIVE' },
]

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-tertiary-dim" />
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-error" />
  return <Minus className="w-3 h-3 text-outline" />
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-16 h-1 bg-surface-container rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: scoreHex(score) }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

function MovementBadge({ rankDelta, scoreDelta }: { rankDelta: number; scoreDelta: number }) {
  const scoreDirection = scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'stable'
  const label = rankDelta > 0 ? `+${rankDelta}` : rankDelta < 0 ? `${rankDelta}` : scoreDirection === 'up' ? 'Score +' : scoreDirection === 'down' ? 'Score -' : null

  if (!label) {
    return null
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]',
        rankDelta > 0 || scoreDirection === 'up'
          ? 'bg-tertiary/10 text-tertiary-dim'
          : 'bg-error/10 text-error'
      )}
    >
      {(rankDelta > 0 || scoreDirection === 'up') ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {label}
    </motion.span>
  )
}

interface Props {
  entries: RankingEntry[]
  profile: InvestorProfile
  onProfile: (profile: InvestorProfile) => void
  loading?: boolean
  refreshing?: boolean
}

function GlobalRankings({ entries, profile, onProfile, loading, refreshing }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const previousEntriesRef = useRef<Record<string, RankingEntry>>({})

  const previousEntries = previousEntriesRef.current

  useEffect(() => {
    previousEntriesRef.current = Object.fromEntries(entries.map(entry => [entry.code, entry]))
  }, [entries])

  return (
    <div className="bg-surface-container-low rounded-2xl ghost-border flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="font-headline font-bold text-base tracking-tight">Global Rankings</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-outline uppercase tracking-widest">
              {entries.length} countries · live data
            </p>
            {refreshing && (
              <span className="text-[9px] uppercase tracking-[0.16em] text-primary">
                updating
              </span>
            )}
          </div>
        </div>

        <div className="flex bg-surface-container rounded-lg p-0.5 gap-0.5">
          {PROFILES.map(item => (
            <button
              key={item.value}
              onClick={() => onProfile(item.value)}
              className={cn(
                'relative px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors duration-200',
                profile === item.value
                  ? 'text-on-surface'
                  : 'text-outline hover:text-on-surface-variant'
              )}
            >
              {profile === item.value && (
                <motion.div
                  layoutId="profile-bg"
                  className="absolute inset-0 bg-surface-container-high rounded-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-2 grid grid-cols-[1.5rem_1fr_3.5rem_4rem] gap-3 items-center">
        <span className="text-[9px] text-outline uppercase tracking-widest">#</span>
        <span className="text-[9px] text-outline uppercase tracking-widest">Country</span>
        <span className="text-[9px] text-outline uppercase tracking-widest text-right">Inflation</span>
        <span className="text-[9px] text-outline uppercase tracking-widest text-right">Score</span>
      </div>

      <div className="h-px bg-outline/8 mx-6" />

      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2">
        {loading ? (
          <div className="space-y-1 px-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-11 rounded-lg shimmer" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-0.5"
          >
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => {
                const previous = previousEntries[entry.code]
                const rankDelta = previous ? previous.rank - entry.rank : 0
                const scoreDelta = previous ? entry.score - previous.score : 0

                return (
                  <motion.div
                    key={entry.code}
                    variants={row}
                    layout
                    onHoverStart={() => setHovered(entry.code)}
                    onHoverEnd={() => setHovered(null)}
                  >
                    <Link
                      href={`/country/${entry.code}`}
                      className={cn(
                        'grid grid-cols-[1.5rem_1fr_3.5rem_4rem] gap-3 items-center',
                        'px-3 py-2.5 rounded-xl transition-all duration-200 group',
                        hovered === entry.code
                          ? 'bg-surface-container-high'
                          : 'hover:bg-surface-container'
                      )}
                    >
                      <span className={cn(
                        'text-[11px] font-bold tabular-nums',
                        index < 3 ? 'text-primary' : 'text-outline'
                      )}>
                        {entry.rank}
                      </span>

                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base leading-none flex-shrink-0">
                          {countryFlag(entry.iso2)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{entry.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TrendIcon trend={entry.trend} />
                            <span className={cn(
                              'text-[9px] font-semibold',
                              entry.trend === 'up' ? 'text-tertiary-dim' :
                              entry.trend === 'down' ? 'text-error' : 'text-outline'
                            )}>
                              {entry.region}
                            </span>
                            <AnimatePresence initial={false}>
                              {(rankDelta !== 0 || scoreDelta !== 0) && (
                                <MovementBadge rankDelta={rankDelta} scoreDelta={scoreDelta} />
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs tabular-nums text-right text-on-surface-variant">
                        {fmtPct(entry.inflation)}
                      </span>

                      <div className="flex flex-col items-end gap-1">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={`${entry.code}-${entry.score.toFixed(2)}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className={cn('text-sm font-extrabold font-headline tabular-nums', scoreColor(entry.score))}
                          >
                            {entry.score.toFixed(1)}
                          </motion.span>
                        </AnimatePresence>
                        <ScoreBar score={entry.score} />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-outline/8">
        <Link
          href="/compare"
          className="flex items-center justify-center gap-2 text-xs font-semibold text-primary
                     hover:text-primary/80 transition-colors duration-200 group"
        >
          Compare countries
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  )
}

function countryFlag(iso2: string) {
  return iso2.toUpperCase().split('').map(character =>
    String.fromCodePoint(0x1f1e6 - 65 + character.charCodeAt(0))
  ).join('')
}

export default memo(GlobalRankings)
