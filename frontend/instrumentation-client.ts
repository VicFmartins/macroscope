import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  sendDefaultPii: false,
})
