'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-surface text-on-surface">
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-xl rounded-3xl border border-outline/20 bg-surface-container-low p-8 text-center shadow-ambient">
            <p className="text-xs uppercase tracking-[0.24em] text-outline">Unexpected Error</p>
            <h1 className="mt-3 text-3xl font-headline font-black tracking-tight">MacroScope hit a rendering failure.</h1>
            <p className="mt-3 text-sm text-on-surface-variant">
              The issue has been captured for investigation. You can retry without leaving the session.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
