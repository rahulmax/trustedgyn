'use client'

import { MapPin, Clock, Languages, Phone, Map, FileText } from 'lucide-react'
import { type Doctor } from '@/lib/types'
import { Badge } from './badge'

type DoctorCardProps = {
  doctor: Doctor
  onViewDetails: (doctor: Doctor) => void
}

export function DoctorCard({ doctor, onViewDetails }: DoctorCardProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address + ', ' + doctor.city)}`

  return (
    <div className="overflow-hidden rounded-[18px] bg-card shadow-sm">
      <div className="px-5 py-[18px]">
        <h3 className="font-serif text-[20px] font-semibold text-text-primary">
          {doctor.name}
        </h3>

        <div className="mt-3 flex flex-col gap-2">
          {(doctor.locality || doctor.fee) && (
            <div className="flex items-center gap-2 text-[15px] text-text-secondary">
              <MapPin size={15} color="#999" className="shrink-0" />
              <span>
                {[doctor.locality, doctor.fee].filter(Boolean).join(' \u00B7 ')}
              </span>
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
          <div className="mt-3 flex flex-wrap gap-1.5">
            {doctor.badges.map((badge) => (
              <Badge key={badge} badgeKey={badge} />
            ))}
          </div>
        )}
      </div>

      {(Array.isArray(doctor.testimonial) ? doctor.testimonial[0] : doctor.testimonial) && (
        <div className="border-t border-border bg-card-inset px-5 py-3.5">
          <p className="text-[15px] italic text-text-secondary">
            &ldquo;{Array.isArray(doctor.testimonial) ? doctor.testimonial[0] : doctor.testimonial}&rdquo;
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 border-t border-border">
        {doctor.phone ? (
          <a
            href={`tel:${doctor.phone}`}
            className="flex items-center justify-center gap-1.5 border-r border-border py-3 text-[15px] font-semibold text-call transition-colors hover:bg-card-inset"
          >
            <Phone size={16} />
            <span>Call</span>
          </a>
        ) : (
          <div className="flex items-center justify-center gap-1.5 border-r border-border py-3 text-[15px] font-semibold text-text-muted opacity-40">
            <Phone size={16} />
            <span>Call</span>
          </div>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-r border-border py-3 text-[15px] font-semibold text-map transition-colors hover:bg-card-inset"
        >
          <Map size={16} />
          <span>Map</span>
        </a>
        <button
          type="button"
          onClick={() => onViewDetails(doctor)}
          className="flex items-center justify-center gap-1.5 py-3 text-[15px] font-semibold text-details transition-colors hover:bg-card-inset"
        >
          <FileText size={16} />
          <span>Details</span>
        </button>
      </div>
    </div>
  )
}
