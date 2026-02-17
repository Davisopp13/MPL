'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'mpl-install-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return

    // Don't show if already running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setDeferredPrompt(null)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }, [])

  if (!visible) return null

  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-3"
      style={{
        backgroundColor: '#E0F2FE',
        borderColor: '#BAE6FD',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: '#0EA5E9' }}
      >
        M
      </div>
      <p className="min-w-0 flex-1 text-sm" style={{ color: '#0C4A6E' }}>
        Install MPL for quick access
      </p>
      <button
        onClick={handleInstall}
        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: '#0EA5E9' }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-lg leading-none"
        style={{ color: '#64748B' }}
        aria-label="Dismiss install prompt"
      >
        ✕
      </button>
    </div>
  )
}
