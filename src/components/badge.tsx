import { BADGE_CONFIG } from '@/lib/badges'
import { type BadgeKey } from '@/lib/types'

export function Badge({ badgeKey }: { badgeKey: BadgeKey }) {
  const config = BADGE_CONFIG[badgeKey]
  return (
    <span
      className="badge-pill rounded-full px-2.5 py-0.5 text-[13px] font-medium"
      style={{
        '--badge-bg': config.bg,
        '--badge-text': config.text,
        '--badge-bg-dark': config.darkBg,
        '--badge-text-dark': config.darkText,
      } as React.CSSProperties}
    >
      {config.label}
    </span>
  )
}
