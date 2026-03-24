import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MacroScope | Global Economic Intelligence',
  description: 'Real-time macroeconomic comparator — ranking, scoring, and AI insights for 30 economies.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-on-surface antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
