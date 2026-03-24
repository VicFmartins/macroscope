'use client'

import { useEffect, useRef } from 'react'

export function useAutoRefresh(callback: () => void, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const intervalId = window.setInterval(() => {
      callbackRef.current()
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [enabled, intervalMs])
}
