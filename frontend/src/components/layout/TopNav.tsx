'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, ChevronDown, RefreshCw, Search, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import type { CountryMetadata, DataSourceMode } from '@/types'
import { cn } from '@/lib/utils'
import { COUNTRIES } from '@/lib/mock-data'
import { getCountryCatalog } from '@/lib/api'

const NAV_LINKS = [
  { label: 'Intelligence', href: '/', active: true },
  { label: 'Markets', href: '#' },
  { label: 'Comparison', href: '/compare' },
  { label: 'Reports', href: '#' },
]

const DEFAULT_CATALOG: CountryMetadata[] = COUNTRIES.map(country => ({
  code: country.code,
  name: country.name,
  iso2: country.iso2.toUpperCase(),
  flag: flagEmoji(country.iso2),
  region: country.region,
  currency: 'USD',
}))

interface TopNavProps {
  connectionStatus?: DataSourceMode
  statusMessage?: string
  onRefreshData?: () => Promise<void> | void
  refreshPending?: boolean
}

export default function TopNav({
  connectionStatus,
  statusMessage,
  onRefreshData,
  refreshPending = false,
}: TopNavProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [catalog, setCatalog] = useState<CountryMetadata[]>(DEFAULT_CATALOG)

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

  const results = query.length > 1
    ? catalog.filter(country =>
      country.name.toLowerCase().includes(query.toLowerCase()) ||
      country.code.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
    : []

  const isDevMode = process.env.NODE_ENV !== 'production'
  const liveBadge = !connectionStatus ? null : connectionStatus === 'live'
    ? {
      label: 'Live',
      icon: Wifi,
      className: 'text-tertiary-dim border-tertiary/30 bg-tertiary/10',
    }
    : connectionStatus === 'partial'
      ? {
        label: 'Partial Sync',
        icon: Wifi,
        className: 'text-primary border-primary/30 bg-primary/10',
      }
      : {
        label: 'Offline Mode',
        icon: WifiOff,
        className: 'text-error border-error/30 bg-error/10',
      }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 w-full flex justify-between items-center px-8 h-20
                 bg-surface/60 backdrop-blur-xl border-b border-outline/20 z-50
                 ambient-shadow font-headline tracking-tight"
    >
      <div className="flex items-center gap-12">
        <div className="flex flex-col">
          <span className="text-2xl font-black font-tightest gradient-text">
            MacroScope
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold -mt-0.5">
            Global Economic Intelligence
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 h-full">
          {NAV_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                'text-sm transition-colors duration-200 relative h-full flex items-center',
                link.active
                  ? 'text-primary'
                  : 'text-on-surface/60 hover:text-on-surface'
              )}
            >
              {link.label}
              {link.active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {liveBadge && (
          <div className="hidden lg:flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
              liveBadge.className,
            )}>
              <liveBadge.icon className="w-3 h-3" />
              <span>{liveBadge.label}</span>
            </div>
            {statusMessage && (
              <span className="max-w-56 truncate text-[10px] text-outline">
                {statusMessage}
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-outline" />
          </div>
          <motion.input
            animate={{ width: focused ? 280 : 240 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            type="text"
            placeholder="Search country..."
            value={query}
            onChange={event => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { window.setTimeout(() => { setFocused(false); setQuery('') }, 150) }}
            className="bg-surface-container-highest border-none rounded-lg pl-9 pr-4 py-2
                       text-sm w-60 focus:ring-1 focus:ring-primary/60 placeholder:text-outline
                       transition-shadow duration-200 outline-none
                       focus:shadow-glow-primary/20"
          />

          {results.length > 0 && focused && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 right-0 bg-surface-container-high
                         rounded-xl border border-outline/20 overflow-hidden z-50 shadow-ambient"
            >
              {results.map(country => (
                <Link
                  key={country.code}
                  href={`/country/${country.code}`}
                  className="flex items-center gap-3 px-4 py-2.5
                             hover:bg-surface-bright transition-colors duration-150"
                >
                  <span className="text-lg">{country.flag}</span>
                  <div>
                    <p className="text-sm font-medium">{country.name}</p>
                    <p className="text-[10px] text-outline uppercase tracking-wider">
                      {country.region}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-outline uppercase tracking-[0.16em]">
                    {country.currency}
                  </span>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isDevMode && onRefreshData && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void onRefreshData()}
              disabled={refreshPending}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline/20
                         text-xs font-semibold text-on-surface-variant hover:text-on-surface
                         hover:bg-surface-bright/40 transition-colors duration-200 disabled:opacity-60"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshPending && 'animate-spin')} />
              Refresh Data
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-surface-bright/50 rounded-lg transition-colors duration-200"
          >
            <Bell className="w-4 h-4 text-on-surface-variant" />
          </motion.button>

          <div className="h-6 w-px bg-outline-variant" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-bright/50
                       rounded-lg transition-colors duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="text-[10px] font-bold text-on-secondary-container">P</span>
            </div>
            <span className="text-xs font-semibold">Premium</span>
            <ChevronDown className="w-3 h-3 text-outline" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}

function flagEmoji(iso2: string) {
  return iso2.toUpperCase().split('').map(character =>
    String.fromCodePoint(0x1f1e6 - 65 + character.charCodeAt(0))
  ).join('')
}
