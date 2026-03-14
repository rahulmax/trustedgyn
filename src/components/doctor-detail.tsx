'use client'

import {
  ArrowLeft, MapPin, Building2, Clock, IndianRupee,
  Languages, Wallet, Phone, Map, ExternalLink, ShieldCheck,
  Users, Check, Minus, HelpCircle,
} from 'lucide-react'
import { BADGE_CONFIG, INCLUSIVITY_GROUP_LABELS, INCLUSIVITY_QUESTION_LABELS } from '@/lib/badges'
import { type Doctor, type BadgeKey } from '@/lib/types'

type DoctorDetailProps = {
  doctor: Doctor
  onBack: () => void
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
  return <HelpCircle size={14} color="#bbb" className="shrink-0" />
}

export function DoctorDetail({ doctor, onBack }: DoctorDetailProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address + ', ' + doctor.city)}`
  const inclusivityEntries = Object.entries(doctor.inclusivity) as [BadgeKey, Record<string, string>][]

  return (
    <div className="min-h-screen bg-bg pb-24">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-1 py-4 text-[15px] text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={18} />
        <span>Back to results</span>
      </button>

      <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
        <div className="px-5 py-5">
          <h2 className="font-serif text-[22px] font-bold text-text-primary">
            {doctor.name}
          </h2>
          {(doctor.gender || doctor.ageRange) && (
            <p className="mt-1 text-[14px] text-text-muted">
              {[doctor.gender, doctor.ageRange ? `Age ${doctor.ageRange}` : ''].filter(Boolean).join(' \u00B7 ')}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2.5">
            {doctor.locality && (
              <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                <MapPin size={15} color="#999" className="shrink-0" />
                <span>{doctor.locality}, {doctor.city}</span>
              </div>
            )}
            {doctor.address && (
              <div className="flex items-start gap-2 text-[15px] text-text-secondary">
                <Building2 size={15} color="#999" className="mt-0.5 shrink-0" />
                <span>{doctor.address}</span>
              </div>
            )}
            {doctor.hours && (
              <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                <Clock size={15} color="#999" className="shrink-0" />
                <span>{doctor.hours}</span>
              </div>
            )}
            {doctor.fee && (
              <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                <IndianRupee size={15} color="#999" className="shrink-0" />
                <span>{doctor.fee}</span>
              </div>
            )}
            {doctor.languages.length > 0 && (
              <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                <Languages size={15} color="#999" className="shrink-0" />
                <span>{doctor.languages.join(', ')}</span>
              </div>
            )}
            {doctor.payment.length > 0 && (
              <div className="flex items-center gap-2 text-[15px] text-text-secondary">
                <Wallet size={15} color="#999" className="shrink-0" />
                <span>{doctor.payment.join(', ')}</span>
              </div>
            )}
          </div>

          {doctor.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {doctor.badges.map((badge) => {
                const config = BADGE_CONFIG[badge]
                return (
                  <span
                    key={badge}
                    className="rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                    style={{ backgroundColor: config.bg, color: config.text }}
                  >
                    {config.label}
                  </span>
                )
              })}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            {doctor.phone ? (
              <a
                href={`tel:${doctor.phone}`}
                className="flex items-center justify-center gap-2 rounded-[12px] py-3 text-[15px] font-semibold transition-colors hover:opacity-80"
                style={{ backgroundColor: '#e6f0e6', color: '#3a6a3a' }}
              >
                <Phone size={16} />
                <span>Call</span>
              </a>
            ) : (
              <div
                className="flex items-center justify-center gap-2 rounded-[12px] py-3 text-[15px] font-semibold opacity-40"
                style={{ backgroundColor: '#e6f0e6', color: '#3a6a3a' }}
              >
                <Phone size={16} />
                <span>Call</span>
              </div>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-[12px] py-3 text-[15px] font-semibold transition-colors hover:opacity-80"
              style={{ backgroundColor: '#e5ecf0', color: '#3a5a6a' }}
            >
              <Map size={16} />
              <span>Directions</span>
            </a>
          </div>
        </div>

        {doctor.testimonial && (
          <div className="border-t border-border px-5 py-4">
            <p className="mb-2 text-[12px] font-medium tracking-wider text-text-muted uppercase">
              Testimonial
            </p>
            <p className="text-[15px] italic text-text-secondary">
              &ldquo;{doctor.testimonial}&rdquo;
            </p>
          </div>
        )}

        {inclusivityEntries.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium tracking-wider text-text-muted uppercase">
                Inclusivity Details
              </p>
              {doctor.responseCount > 0 && (
                <div className="flex items-center gap-1 text-[13px] text-[#bbb]">
                  <Users size={13} />
                  <span>Based on {doctor.responseCount} response{doctor.responseCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-5">
              {inclusivityEntries.map(([key, group]) => {
                const score = getGroupScore(group)
                const dotColor = score >= 0.8 ? '#6aaa6a' : score >= 0.6 ? '#d4aa5a' : '#ccc'
                const filteredQuestions = Object.entries(group).filter(([, v]) => v && v !== '')

                if (filteredQuestions.length === 0) return null

                return (
                  <div key={key}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="text-[15px] font-semibold text-text-primary">
                        {INCLUSIVITY_GROUP_LABELS[key] ?? key}
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
              <span>Office reported as hygienic</span>
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
                <span className="underline">View original entry on Google Sheets</span>
                <p className="mt-0.5 text-[13px] text-text-muted">
                  From the crowdsourced directory by @AmbaAzaad
                </p>
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
