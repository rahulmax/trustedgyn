'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Languages, Phone, Map, BadgeCheck, Briefcase, ExternalLink, ChevronRight } from 'lucide-react'
import { type Doctor, type BadgeKey } from '@/lib/types'
import { useTranslation } from '@/lib/translation-context'
import { citySlug, getValidTestimonials } from '@/lib/utils'
import { Badge } from './badge'

type DoctorCardProps = {
  doctor: Doctor
  onViewDetails: (doctor: Doctor) => void
  onBadgeClick?: (badge: BadgeKey) => void
}

export function DoctorCard({ doctor, onViewDetails, onBadgeClick }: DoctorCardProps) {
  const { t } = useTranslation()
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address + ', ' + doctor.city)}`

  return (
    <div className="overflow-hidden rounded-[18px] bg-card shadow-sm">
      <div className="px-5 py-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[22px] font-semibold text-text-heading">
              <button
                type="button"
                onClick={() => onViewDetails(doctor)}
                className="flex items-center gap-1.5 text-left transition-colors hover:text-text-primary"
              >
                <span>{doctor.name}</span>
                {doctor.verified && (
                  <BadgeCheck size={16} className="shrink-0 text-green-600 dark:text-green-400" />
                )}
                <ChevronRight size={16} className="shrink-0 text-text-muted" />
              </button>
            </h3>
            {doctor.qualifications && (
              <p className="mt-0.5 text-[13px] text-text-muted">{doctor.qualifications}</p>
            )}
          </div>
          {doctor.photoUrl && (
            <Image
              src={doctor.photoUrl}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {(doctor.locality || doctor.city || doctor.fee) && (
            <div className="flex items-center gap-2 text-[15px] text-text-secondary">
              <MapPin size={15} color="#999" className="shrink-0" />
              <span>
                {doctor.locality && <>{doctor.locality} · </>}
                <Link
                  href={`/city/${citySlug(doctor.city)}`}
                  className="underline decoration-border underline-offset-2 hover:decoration-text-muted hover:text-text-primary"
                >
                  {doctor.city}
                </Link>
                {doctor.fee && <> · {doctor.fee}</>}
              </span>
            </div>
          )}
          {doctor.experience && (
            <div className="flex items-center gap-2 text-[15px] text-text-secondary">
              <Briefcase size={15} color="#999" className="shrink-0" />
              <span>{doctor.experience} exp.</span>
            </div>
          )}
          {doctor.hours && (
            <div className="flex items-center gap-2 text-[15px] text-text-secondary">
              <Clock size={15} color="#999" className="shrink-0" />
              <span>{doctor.hours}</span>
            </div>
          )}
          {doctor.languages.length > 0 && (
            <div className="flex items-center gap-2 text-[15px] text-text-secondary">
              <Languages size={15} color="#999" className="shrink-0" />
              <span>{doctor.languages.join(', ')}</span>
            </div>
          )}
        </div>

        {doctor.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
            {doctor.badges.slice(0, 3).map((badge) => (
              <Badge key={badge} badgeKey={badge} onClick={onBadgeClick} />
            ))}
            {doctor.badges.length > 3 && (
              <span className="inline-flex items-baseline gap-1.5">
                <Badge badgeKey={doctor.badges[3]} onClick={onBadgeClick} />
                {doctor.badges.length > 4 && (
                  <span className="text-[13px] text-text-muted">
                    +{doctor.badges.length - 4}
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {doctor.practoUrl && (
          <a
            href={doctor.practoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[13px] text-text-muted transition-colors hover:text-text-primary"
          >
            <ExternalLink size={12} className="shrink-0" />
            <span>Practo profile</span>
          </a>
        )}
      </div>

      {(() => {
        const valid = getValidTestimonials(doctor.testimonial)
        return valid.length > 0 ? (
          <div className="border-t border-border bg-card-inset px-5 py-3.5">
            <p className="line-clamp-3 text-[15px] italic tracking-tight text-text-secondary" style={{ wordSpacing: '0.05em' }}>
              &ldquo;{valid[0]}&rdquo;
            </p>
          </div>
        ) : null
      })()}

      <div className={`grid border-t border-border ${doctor.phone ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {doctor.phone && (
          <a
            href={`tel:${doctor.phone}`}
            className="flex items-center justify-center gap-1.5 border-r border-border py-3 text-[15px] font-semibold text-call transition-colors hover:bg-card-inset"
          >
            <Phone size={16} />
            <span>{t('call')}</span>
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-r border-border py-3 text-[15px] font-semibold text-map transition-colors hover:bg-card-inset"
        >
          <Map size={16} />
          <span>{t('map')}</span>
        </a>
        <button
          type="button"
          onClick={() => onViewDetails(doctor)}
          className="flex items-center justify-center gap-1.5 py-3 text-[15px] font-semibold text-details transition-colors hover:bg-card-inset"
        >
          <span>{t('details')}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
