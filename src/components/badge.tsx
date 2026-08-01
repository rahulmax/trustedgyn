'use client'

import { BADGE_CONFIG, BADGE_LABEL_KEYS } from '@/lib/badges'
import { type BadgeKey } from '@/lib/types'
import { useTranslation } from '@/lib/translation-context'

export function Badge({ badgeKey, onClick }: { badgeKey: BadgeKey; onClick?: (badge: BadgeKey) => void }) {
  const { t } = useTranslation()
  const config = BADGE_CONFIG[badgeKey]

  const handleClick = onClick ? (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(badgeKey)
  } : undefined

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClick(badgeKey) } } : undefined}
      className={`badge-pill rounded-full px-2.5 py-0.5 text-[13px] font-medium${onClick ? ' cursor-pointer transition-opacity hover:opacity-75' : ''}`}
      style={{
        '--badge-bg': config.bg,
        '--badge-text': config.text,
        '--badge-bg-dark': config.darkBg,
        '--badge-text-dark': config.darkText,
      } as React.CSSProperties}
    >
      {t(BADGE_LABEL_KEYS[badgeKey])}
    </span>
  )
}
