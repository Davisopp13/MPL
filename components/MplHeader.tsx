interface MplHeaderProps {
  initials?: string
  team?: 'CH' | 'MH'
}

export default function MplHeader({ initials, team }: MplHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-mpl-primary-dark to-mpl-primary px-4 py-3">
      <div className="mx-auto flex max-w-[430px] items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg font-bold text-white">
          M
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight text-white">
            MPL
          </h1>
          <p className="text-xs leading-tight text-white/70">
            Manual Process Log
          </p>
        </div>
        {initials && team && (
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                team === 'CH'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {team}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
              {initials}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
