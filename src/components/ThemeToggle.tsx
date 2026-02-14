'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { FlashbangSound } from '../lib/FlashbangSound'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const [isExploding, setIsExploding] = useState(false)
  const soundRef = useRef<FlashbangSound | null>(null)

  useEffect(() => {
    soundRef.current = new FlashbangSound()
  }, [])

  const flashbang = useCallback(() => {
    setIsExploding(true)

    // Play throw sound
    soundRef.current?.playThrow()

    // Create elements
    const overlay = document.createElement('div')
    overlay.className = 'flashbang-overlay'
    document.body.appendChild(overlay)

    const grenade = document.createElement('img')
    grenade.src = '/flashbang.png'
    grenade.className = 'flashbang-grenade'
    grenade.style.width = '60px'
    document.body.appendChild(grenade)

    // Bounce sounds synced with animation (approx)
    // - 0ms: Throw
    // - 40% (480ms): First peak
    // - 60% (720ms): Bounce 1
    // - 80% (960ms): Bounce 2
    setTimeout(() => soundRef.current?.playBounce(), 720)
    setTimeout(() => soundRef.current?.playBounce(), 960)

    // Sequence
    setTimeout(() => {
      // 1. Detonate (Screen goes white instantly)
      soundRef.current?.playExplosion()
      overlay.classList.add('active')
      grenade.remove()

      // 2. Switch Theme (while screen is white)
      setDark(false)
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')

      // 3. Start Fade Out
      requestAnimationFrame(() => {
        setTimeout(() => {
          overlay.classList.remove('active') // Triggers the 2.5s transition

          // Cleanup after fade
          setTimeout(() => {
            overlay.remove()
            setIsExploding(false)
          }, 2500)
        }, 50)
      })
    }, 1200) // Match CSS animation duration
  }, [])

  function toggle() {
    if (dark) {
      // Creating light -> Flashbang!
      flashbang()
    } else {
      // Creating dark -> Instant
      setDark(true)
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  if (!mounted) return null

  return (
    <div className="theme-toggle-wrapper">
      <button
        onClick={toggle}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0.25rem',
          lineHeight: 1,
          color: 'var(--color-muted)',
        }}
      >
        {dark ? '\u2600' : '\u263E'}
      </button>
      <span className="theme-tooltip">
        {dark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </div>
  )
}
