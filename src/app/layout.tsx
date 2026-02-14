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
              // Auto-reload on chunk load errors (stale deployment)
              function handleChunkError(msg) {
                if (msg && (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1)) {
                  var key = 'chunk_reload';
                  var last = sessionStorage.getItem(key);
                  var now = Date.now();
                  if (!last || now - Number(last) > 10000) {
                    sessionStorage.setItem(key, String(now));
                    window.location.reload();
                  }
                }
              }
              window.addEventListener('error', function(e) {
                handleChunkError(e.message || '');
              });
              window.addEventListener('unhandledrejection', function(e) {
                handleChunkError(e.reason ? (e.reason.message || String(e.reason)) : '');
              });
            `,
          }}
        />
      </head>
      <body>
        <header>
          <nav>
            <a href="/" id="site-title">Cult of Jamie</a>
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
