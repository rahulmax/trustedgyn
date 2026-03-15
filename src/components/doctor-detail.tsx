'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, Clock, IndianRupee,
  Languages, Wallet, Phone, Map, ExternalLink, ShieldCheck,
  Users, Check, Minus, HelpCircle, ChevronLeft, ChevronRight,
  Briefcase, Stethoscope, Share2,
} from 'lucide-react'
import { doctorSlug, getValidTestimonials } from '@/lib/utils'
import { INCLUSIVITY_GROUP_LABELS, INCLUSIVITY_QUESTION_LABELS } from '@/lib/badges'
import { type Doctor, type BadgeKey } from '@/lib/types'
import { useTranslation } from '@/lib/translation-context'
import { Badge } from './badge'

type DoctorDetailProps = {
  doctor: Doctor
  onBack: (() => void) | string
}

function getGroupScore(group: Record<string, string>): number {
  const entries = Object.entries(group).filter(([, v]) => v && v !== '')
  if (entries.length === 0) return 0
  const yesCount = entries.filter(([, v]) => v === 'Yes' || v === 'Probably Yes').length
  return yesCount / entries.length
}

function AnswerIcon({ answer }: { answer: string }) {
  if (answer === 'Yes' || answer === 'Probably Yes') {
    return <Check size={14} color="#5a9a5a" className="shrink-0" />
  }
  if (answer === 'Maybe') {
    return <Minus size={14} color="#bba050" className="shrink-0" />
  }
  return <HelpCircle size={14} className="shrink-0 text-text-muted" />
}

const GROUP_LABEL_KEYS: Record<BadgeKey, keyof ReturnType<typeof useTranslation>['strings']> = {
  'queer-friendly': 'groupLgbtq',
  'reproductive-autonomy': 'groupRepro',
  'trauma-informed': 'groupTrauma',
  'accessible': 'groupAccessibility',
  'financially-considerate': 'groupFinancial',
  'confidential-autonomous': 'groupConfidentiality',
  'sex-positive': 'groupSexual',
  'non-traditional-family': 'groupFamily',
}

type BackLinkProps = {
  onBack: (() => void) | string
  label: string
  className: string
  iconSize?: number
}

function BackLink({ onBack, label, className, iconSize = 18 }: BackLinkProps) {
  return typeof onBack === 'string' ? (
    <Link href={onBack} className={className}>
      <ArrowLeft size={iconSize} />
      <span>{label}</span>
    </Link>
  ) : (
    <button type="button" onClick={onBack} className={className}>
      <ArrowLeft size={iconSize} />
      <span>{label}</span>
    </button>
  )
}

export function DoctorDetail({ doctor, onBack }: DoctorDetailProps) {
  const { t, language } = useTranslation()

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address + ', ' + doctor.city)}`
  const inclusivityEntries = Object.entries(doctor.inclusivity) as [BadgeKey, Record<string, string>][]
  const testimonials = getValidTestimonials(doctor.testimonial)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const permalink = `/doctor/${doctorSlug(doctor)}`
  const fullUrl = `https://trustedgyn.com${permalink}`
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: doctor.name, url: fullUrl })
      } else {
        await navigator.clipboard.writeText(fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled share sheet or clipboard permission denied
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg pb-24">
      <BackLink onBack={onBack} label={t('backToResults')} className="flex items-center gap-2 px-1 py-4 text-[15px] text-text-secondary transition-colors hover:text-text-primary" />

      <div className="overflow-hidden rounded-[18px] bg-card shadow-sm">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 font-serif text-[24px] font-bold break-words text-text-heading">
                <span className="break-words">{doctor.name}</span>
                {/* TODO: add verified badge once logic is defined */}
              </h2>
              {doctor.qualifications && (
                <p className="mt-0.5 text-[13px] text-text-muted">{doctor.qualifications}</p>
              )}
              {(doctor.gender || doctor.ageRange) && (
                <p className="mt-0.5 text-[14px] text-text-muted">
                  {[doctor.gender, doctor.ageRange ? `Age ${doctor.ageRange}` : ''].filter(Boolean).join(' \u00B7 ')}
                </p>
              )}
            </div>
            {doctor.photoUrl && (
              <Image
                src={doctor.photoUrl}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
            )}
          </div>
        </div>

        {(doctor.experience || doctor.clinic || doctor.locality || doctor.address) && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex flex-col gap-2.5">
              {doctor.experience && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <Briefcase size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.experience} experience</span>
                </div>
              )}
              {doctor.clinic && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <Stethoscope size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.clinic}</span>
                </div>
              )}
              {doctor.locality && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <MapPin size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.locality}, {doctor.city}</span>
                </div>
              )}
              {doctor.address && (
                <div className="flex items-start gap-2 text-[15px] text-text-secondary">
                  <Building2 size={15} className="mt-0.5 shrink-0 text-text-muted" />
                  <span>{doctor.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(doctor.hours || doctor.fee || doctor.languages.length > 0 || doctor.payment.length > 0 || (doctor.phones && doctor.phones.length > 1)) && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex flex-col gap-2.5">
              {doctor.hours && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <Clock size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.hours}</span>
                </div>
              )}
              {doctor.fee && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <IndianRupee size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.fee}</span>
                </div>
              )}
              {doctor.languages.length > 0 && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <Languages size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.languages.join(', ')}</span>
                </div>
              )}
              {doctor.payment.length > 0 && (
                <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                  <Wallet size={15} className="shrink-0 text-text-muted" />
                  <span>{doctor.payment.join(', ')}</span>
                </div>
              )}
              {doctor.phones && doctor.phones.length > 1 && (
                <div className="flex items-start gap-2 text-[15px] text-text-secondary">
                  <Phone size={15} className="mt-0.5 shrink-0 text-text-muted" />
                  <div className="flex flex-col gap-0.5">
                    {doctor.phones.map((p, i) => (
                      <a key={p} href={`tel:${p}`} className="transition-colors hover:text-text-primary">
                        {doctor.phonesDisplay?.[i] ?? p}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {doctor.badges.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex flex-wrap gap-1.5">
              {doctor.badges.map((badge) => (
                <Badge key={badge} badgeKey={badge} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border px-5 py-4">
          <div className="flex flex-wrap gap-3">
            {doctor.phone ? (
              <a
                href={`tel:${doctor.phone}`}
                className="flex flex-1 min-w-[calc(50%-6px)] items-center justify-center gap-2 rounded-[12px] bg-call-bg py-3 text-[15px] font-semibold text-call transition-colors hover:opacity-80"
              >
                <Phone size={16} />
                <span>{t('call')}</span>
              </a>
            ) : (
              <div
                className="flex flex-1 min-w-[calc(50%-6px)] items-center justify-center gap-2 rounded-[12px] bg-call-bg py-3 text-[15px] font-semibold text-call opacity-40"
              >
                <Phone size={16} />
                <span>{t('call')}</span>
              </div>
            )}
            <a
              href={doctor.googleMapsUrl || mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 min-w-[calc(50%-6px)] items-center justify-center gap-2 rounded-[12px] bg-map-bg py-3 text-[15px] font-semibold text-map transition-colors hover:opacity-80"
            >
              <Map size={16} />
              <span>{t('directions')}</span>
            </a>
            {doctor.practoUrl && (
              <a
                href={doctor.practoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 min-w-[calc(50%-6px)] items-center justify-center gap-2 rounded-[12px] bg-card-inset py-3 text-[15px] font-semibold text-text-secondary transition-colors hover:opacity-80"
              >
                <ExternalLink size={16} />
                <span>Practo</span>
              </a>
            )}
            <button
              onClick={handleShare}
              className="flex flex-1 min-w-[calc(50%-6px)] cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-card-inset py-3 text-[15px] font-semibold text-text-secondary transition-colors hover:opacity-80"
            >
              <Share2 size={16} />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>



        {testimonials.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-medium tracking-wider text-text-muted uppercase">
                {testimonials.length > 1 ? t('testimonials') : t('testimonial')}
              </p>
              {testimonials.length > 1 && (
                <span className="text-[12px] text-text-muted">
                  {testimonialIndex + 1} / {testimonials.length}
                </span>
              )}
            </div>
            <div className="relative">
              {testimonials.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                  className="absolute -left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-card text-text-muted shadow-sm transition-colors hover:text-text-primary"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <p className={`text-[15px] italic tracking-tight text-text-secondary ${testimonials.length > 1 ? 'px-6' : ''}`} style={{ wordSpacing: '0.05em' }}>
                &ldquo;{testimonials[testimonialIndex]}&rdquo;
              </p>
              {testimonials.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                  className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-card text-text-muted shadow-sm transition-colors hover:text-text-primary"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {inclusivityEntries.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium tracking-wider text-text-muted uppercase">
                {t('inclusivityDetails')}
              </p>
              {doctor.responseCount > 0 && (
                <div className="flex items-center gap-1 text-[13px] text-text-muted">
                  <Users size={13} />
                  <span>{t('basedOnResponses', { count: doctor.responseCount, plural: doctor.responseCount !== 1 ? 's' : '' })}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-5">
              {inclusivityEntries.map(([key, group]) => {
                const score = getGroupScore(group)
                const dotColor = score >= 0.8 ? '#6aaa6a' : score >= 0.6 ? '#d4aa5a' : '#ccc'
                const filteredQuestions = Object.entries(group).filter(([, v]) => v && v !== '')

                if (filteredQuestions.length === 0) return null

                const labelKey = GROUP_LABEL_KEYS[key]
                const groupLabel = language !== 'en' && labelKey ? t(labelKey) : (INCLUSIVITY_GROUP_LABELS[key] ?? key)

                return (
                  <div key={key}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="text-[15px] font-semibold text-text-primary">
                        {groupLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-4">
                      {filteredQuestions.map(([qKey, answer]) => (
                        <div key={qKey} className="flex items-start gap-2 text-[14px] text-text-secondary">
                          <AnswerIcon answer={answer} />
                          <span>{INCLUSIVITY_QUESTION_LABELS[qKey] ?? qKey}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {doctor.hygienic && doctor.hygienic.toLowerCase().includes('yes') && (
          <div className="border-t border-border px-5 py-3.5">
            <div className="flex items-center gap-2 text-[14px] text-text-secondary">
              <ShieldCheck size={14} color="#5a9a5a" className="shrink-0" />
              <span>{t('officeHygienic')}</span>
            </div>
          </div>
        )}

        {doctor.sheetUrl && (
          <div className="border-t border-border px-5 py-4">
            <a
              href={doctor.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-text-primary"
            >
              <ExternalLink size={14} className="shrink-0" />
              <div>
                <span className="underline">{t('viewOriginal')}</span>
                <p className="mt-0.5 text-[13px] text-text-muted">
                  {t('originalCredit')}
                </p>
              </div>
            </a>
          </div>
        )}
      </div>

      <BackLink onBack={onBack} label={t('backToResults')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] bg-card py-3.5 text-[15px] font-semibold text-text-secondary shadow-sm transition-colors hover:text-text-primary" iconSize={16} />
    </div>
  )
}
