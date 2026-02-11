import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cult of Jamie — Dictionary',
  description: 'A dictionary of philosophical and experiential terms.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <a href="/">Cult of Jamie</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; Cult of Jamie</p>
        </footer>
      </body>
    </html>
  )
}
