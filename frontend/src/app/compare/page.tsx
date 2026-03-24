'use client'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import TopNav        from '@/components/layout/TopNav'
import Sidebar       from '@/components/layout/Sidebar'
import { SkeletonCard } from '@/components/ui/Skeleton'

const ComparisonPanel = dynamic(() => import('@/components/comparison/ComparisonPanel'), {
  ssr: false,
  loading: () => <LoadingFallback />,
})

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="h-80 shimmer rounded-2xl" />
    </div>
  )
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav />
      <Sidebar />

      <main className="pt-20 lg:pl-64">
        <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y:  0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-headline text-4xl font-black tracking-tightest">
              Country{' '}
              <span className="gradient-text">Comparison</span>
            </h1>
            <p className="text-on-surface-variant mt-1 text-sm">
              Analyze up to 4 countries side-by-side across macro indicators
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y:  0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <ComparisonPanel initial={['USA', 'DEU', 'BRA']} />
            </Suspense>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
