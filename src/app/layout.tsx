import type { Metadata } from 'next'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Cult of Jamie',
  description: 'A dictionary and FAQ of philosophical and experiential terms.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <header>
          <nav>
            <a href="/">Cult of Jamie</a>
            <ThemeToggle />
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
