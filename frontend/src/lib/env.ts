const PRODUCTION_FALLBACK_SITE_URL = 'https://macroscope-silk.vercel.app'

function readString(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed.replace(/\/$/, '') : undefined
}

function ensureUrl(value: string | undefined, name: string, required: boolean): string | undefined {
  const normalized = readString(value)

  if (!normalized) {
    if (required) {
      throw new Error(`${name} is required for this environment.`)
    }
    return undefined
  }

  new URL(normalized)
  return normalized
}

const isProductionRuntime = process.env.NODE_ENV === 'production'

export const appEnv = {
  apiBaseUrl: ensureUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL,
    'NEXT_PUBLIC_API_BASE_URL',
    isProductionRuntime,
  ) ?? 'http://localhost:8080',
  siteUrl: ensureUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    'NEXT_PUBLIC_SITE_URL',
    false,
  ) ?? (isProductionRuntime ? PRODUCTION_FALLBACK_SITE_URL : 'http://localhost:3000'),
  collectionTriggerApiKey: readString(process.env.NEXT_PUBLIC_COLLECTION_TRIGGER_API_KEY),
}
