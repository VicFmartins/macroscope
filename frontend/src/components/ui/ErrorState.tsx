import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message?: string
  className?: string
}

export function ErrorState({ message = 'Failed to load data.', className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}>
      <span className="material-symbols-outlined text-error text-3xl">error_outline</span>
      <p className="text-sm text-on-surface-variant">{message}</p>
    </div>
  )
}
