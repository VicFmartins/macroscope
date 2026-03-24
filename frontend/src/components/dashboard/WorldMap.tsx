'use client'
import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MouseEvent } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import type { CountryData } from '@/types'
import { scoreHex, scoreGlow, fmtPct, cn } from '@/lib/utils'
import { ISO3_TO_NUMERIC } from '@/lib/mock-data'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface TooltipData {
  name:      string
  score:     number
  inflation: number
  trend:     'up' | 'down' | 'stable'
  x:         number
  y:         number
}

const DEFAULT_FILL   = '#1a1f2e'
const HOVER_FILL     = '#262c3d'
const STROKE_COLOR   = 'rgba(113,117,131,0.15)'

interface Props {
  countries: CountryData[]
  loading?:  boolean
}

function WorldMap({ countries, loading }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  // Build a quick lookup: numeric id → CountryData
  const scoreMap: Record<string, CountryData> = {}
  for (const c of countries) {
    const num = ISO3_TO_NUMERIC[c.code]
    if (num) scoreMap[String(num)] = c
  }

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-2xl ghost-border p-6">
        <div className="h-5 w-32 shimmer rounded mb-4" />
        <div className="h-64 shimmer rounded-xl" />
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-2xl ghost-border p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-headline font-bold text-base tracking-tight">Global Heat Map</h2>
          <p className="text-[10px] text-outline mt-0.5 uppercase tracking-widest">
            Macro investment score by country
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-8 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #ff716c, #3bbffa, #48e5d0)' }} />
          </div>
          <span className="text-[9px] text-outline uppercase tracking-wider">Low → High</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: 340 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 110, center: [10, 20] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={1} minZoom={0.9} maxZoom={4}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const id   = String(geo.id)
                  const data = scoreMap[id]
                  const fill = data ? scoreHex(data.score) : DEFAULT_FILL

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={STROKE_COLOR}
                      strokeWidth={0.4}
                      style={{
                        default: { outline: 'none', transition: 'fill 0.2s ease' },
                        hover:   { outline: 'none', fill: data ? fill : HOVER_FILL, filter: data ? 'brightness(1.2)' : 'none' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={(evt: MouseEvent<SVGPathElement>) => {
                        if (!data) return
                        setTooltip({
                          name:      data.name,
                          score:     data.score,
                          inflation: data.inflation ?? 0,
                          trend:     data.trend,
                          x: evt.clientX,
                          y: evt.clientY,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Custom tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              key="map-tooltip"
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1,   y: 0 }}
              exit={{    opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none fixed z-50 glass rounded-xl px-3 py-2.5 shadow-ambient"
              style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
            >
              <p className="text-xs font-bold font-headline">{tooltip.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <div>
                  <p className="text-[9px] text-outline uppercase tracking-widest">Score</p>
                  <p
                    className="text-sm font-extrabold tabular-nums"
                    style={{ color: scoreHex(tooltip.score) }}
                  >
                    {tooltip.score.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-outline uppercase tracking-widest">Inflation</p>
                  <p className="text-sm font-bold tabular-nums text-on-surface">
                    {fmtPct(tooltip.inflation)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Score scale legend */}
      <div className="mt-3 flex items-center gap-3">
        {[
          { label: '0–25',  color: '#ff716c' },
          { label: '25–50', color: '#ff9f6c' },
          { label: '50–75', color: '#3bbffa' },
          { label: '75–100',color: '#48e5d0' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] text-outline">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(WorldMap)
