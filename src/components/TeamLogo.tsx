import { useState } from 'react'
import { cn } from 'cn'

export function logoPath(team: string): string {
  return `/logos/${team.replace(' ', '_').toLowerCase()}.png`
}

/** Team crest with graceful initial fallback if the file is missing. */
export function TeamLogo({
  team,
  size = 'md',
  className,
}: {
  team: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const dims =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
        ? 'w-16 h-16'
        : size === 'xl'
          ? 'w-20 h-20'
          : 'w-14 h-14'
  const text = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-xl'

  return (
    <div
      className={cn(
        'rounded-full bg-white flex items-center justify-center shadow-inner overflow-hidden shrink-0 ring-1 ring-black/10',
        dims,
        className,
      )}
    >
      {failed ? (
        <span className={cn('font-black text-black/80', text)}>{team.charAt(0)}</span>
      ) : (
        <img
          src={logoPath(team)}
          alt={team}
          className="w-[72%] h-[72%] object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
