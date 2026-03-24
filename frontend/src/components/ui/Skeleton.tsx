'use client'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded bg-surface-container-high shimmer',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-container-high rounded-xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-3 w-24 mt-4" />
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-6" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="text-right space-y-1.5">
        <Skeleton className="h-4 w-10 ml-auto" />
        <Skeleton className="h-3 w-6 ml-auto" />
      </div>
    </div>
  )
}
