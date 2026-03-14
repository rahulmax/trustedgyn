'use client'

import { BADGE_CONFIG } from '@/lib/badges'
import { type BadgeKey } from '@/lib/types'
import { useTranslation } from '@/lib/translation-context'
import { type UIStrings } from '@/lib/i18n'

const BADGE_LABEL_KEYS: Record<BadgeKey, keyof UIStrings> = {
  'queer-friendly': 'badgeQueerFriendly',
  'reproductive-autonomy': 'badgeReproAutonomy',
  'trauma-informed': 'badgeTraumaInformed',
  'accessible': 'badgeAccessible',
  'financially-considerate': 'badgeAffordable',
  'confidential-autonomous': 'badgeConfidentialAutonomous',
  'sex-positive': 'badgeSexPositive',
  'non-traditional-family': 'badgeNonTradFamily',
}

export function Badge({ badgeKey }: { badgeKey: BadgeKey }) {
  const { t } = useTranslation()
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
      {t(BADGE_LABEL_KEYS[badgeKey])}
    </span>
  )
}
