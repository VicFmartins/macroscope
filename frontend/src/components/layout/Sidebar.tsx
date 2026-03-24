'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/',        icon: 'terminal',      label: 'Terminal' },
  { href: '#',        icon: 'public',        label: 'Heatmap' },
  { href: '#',        icon: 'insights',      label: 'Analytics' },
  { href: '#',        icon: 'auto_awesome',  label: 'AI Insights' },
  { href: '/compare', icon: 'compare_arrows',label: 'Compare' },
]

const BOTTOM = [
  { href: '#', icon: 'settings', label: 'Settings' },
  { href: '#', icon: 'help',     label: 'Support' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
}
const item = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x:  0, transition: { ease: 'easeOut', duration: 0.3 } },
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-surface-container-low
                      flex flex-col py-6 border-r border-outline/10 hidden lg:flex z-40">
      {/* Terminal status */}
      <div className="px-6 mb-8">
        <div className="bg-surface-container-high p-4 rounded-xl flex items-center gap-4 ghost-border">
          <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">public</span>
          </div>
          <div>
            <p className="text-xs font-bold font-headline">Global Intelligence</p>
            <p className="text-[10px] text-outline flex items-center gap-1 mt-0.5">
              <span className="pulse-dot" />
              Terminal Active
            </p>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <motion.nav
        className="flex-1 px-4 space-y-1"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {LINKS.map(link => {
          const active = pathname === link.href
          return (
            <motion.div key={link.label} variants={item}>
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 group relative',
                  active
                    ? 'text-primary bg-primary/8'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container-high'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute right-0 top-1 bottom-1 w-0.5 bg-primary rounded-full"
                  />
                )}
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span className="font-medium text-sm">{link.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Bottom */}
      <div className="px-4 space-y-1">
        {BOTTOM.map(link => (
          <Link
            key={link.label}
            href={link.href}
            className="flex items-center gap-4 px-4 py-2.5 text-outline
                       hover:text-on-surface hover:bg-surface-container-high
                       rounded-lg transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
            <span className="font-medium text-sm">{link.label}</span>
          </Link>
        ))}

        {/* Upgrade CTA */}
        <div className="mt-4 p-4 bg-primary/8 rounded-xl border border-primary/20">
          <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-widest">
            Upgrade Analysis
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-brand text-on-primary py-2 rounded text-xs
                       font-bold transition-opacity hover:opacity-90"
          >
            Go Enterprise
          </motion.button>
        </div>
      </div>
    </aside>
  )
}
