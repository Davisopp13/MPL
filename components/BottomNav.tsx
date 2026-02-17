'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/log', label: 'Log', icon: '➕' },
  { href: '/history', label: 'History', icon: '📋' },
  { href: '/insights', label: 'Insights', icon: '📊' },
  { href: '/team', label: 'Team', icon: '👥' },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-mpl-border bg-mpl-surface">
      <div className="mx-auto flex max-w-[430px] items-stretch">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 pb-[env(safe-area-inset-bottom)] pt-2 pb-2 text-xs transition-colors duration-150 ${
                isActive
                  ? 'border-t-2 border-mpl-primary text-mpl-primary'
                  : 'border-t-2 border-transparent text-slate-400'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
