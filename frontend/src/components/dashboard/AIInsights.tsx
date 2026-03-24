'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Globe, ChevronRight } from 'lucide-react'
import type { AIInsight } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_CONFIG = {
  fiscal: {
    icon:  TrendingUp,
    color: 'text-primary',
    bg:    'bg-primary/10',
    pill:  'bg-primary/15 text-primary',
  },
  currency: {
    icon:  Globe,
    color: 'text-secondary',
    bg:    'bg-secondary/10',
    pill:  'bg-secondary/15 text-secondary',
  },
  growth: {
    icon:  TrendingUp,
    color: 'text-tertiary-dim',
    bg:    'bg-tertiary/10',
    pill:  'bg-tertiary/15 text-tertiary-dim',
  },
  risk: {
    icon:  AlertTriangle,
    color: 'text-error',
    bg:    'bg-error/10',
    pill:  'bg-error/15 text-error',
  },
} as const

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const insight = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y:  0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5 } },
}

interface Props {
  insights: AIInsight[]
  loading?: boolean
}

export default function AIInsights({ insights, loading }: Props) {
  const [expanded, setExpanded] = useState<string | null>(insights[0]?.id ?? null)

  return (
    <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-headline font-bold text-base tracking-tight">AI Insights</h2>
          <p className="text-[10px] text-outline mt-0.5">
            <span className="pulse-dot mr-1.5" />
            Powered by Gemini · updated now
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {insights.map(item => {
            const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.fiscal
            const Icon = cfg.icon
            const isOpen = expanded === item.id

            return (
              <motion.div key={item.id} variants={insight}>
                <motion.button
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.998 }}
                  className={cn(
                    'w-full text-left p-4 rounded-xl transition-all duration-200 group',
                    isOpen
                      ? 'bg-surface-container-high ghost-border'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-1.5 rounded-lg flex-shrink-0 mt-0.5', cfg.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.country && (
                          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider', cfg.pill)}>
                            {item.country}
                          </span>
                        )}
                        <span className="text-[9px] text-outline">{item.type}</span>
                      </div>
                      <p className="text-sm font-semibold leading-snug">{item.title}</p>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{    height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="text-xs text-on-surface-variant mt-2 leading-relaxed overflow-hidden"
                          >
                            {item.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 mt-0.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-outline" />
                    </motion.div>
                  </div>
                </motion.button>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
