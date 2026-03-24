const requiredInProduction = ['NEXT_PUBLIC_API_BASE_URL']

function ensureValidUrl(name, value) {
  new URL(value)
}

const isProductionBuild =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.CI_DEPLOY === 'true'

if (isProductionBuild) {
  for (const name of requiredInProduction) {
    const value = process.env[name]?.trim()
    if (!value) {
      throw new Error(`${name} is required for production builds`)
    }
    ensureValidUrl(name, value)

    if (!value.startsWith('https://') && !value.startsWith('http://localhost')) {
      throw new Error(`${name} must use HTTPS outside local development`)
    }
  }
}

if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  ensureValidUrl('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL.trim())
}

console.log('Frontend environment validation passed.')
